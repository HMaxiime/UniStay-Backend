import prisma from "../config/prisma.js";

type SubmittedAnswer = {
  questionId: string;
  selectedOptionId: string;
};

const EXAM_QUESTION_LIMIT = 10;

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function startAssignment(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: true,
      questions: { include: { options: true } },
    },
  });
  if (!assignment) throw new Error("Assignment not found");
  if (assignment.questions.length === 0) {
    throw new Error("This assignment has no questions yet");
  }

  const selectedQuestions = shuffle(assignment.questions).slice(0, EXAM_QUESTION_LIMIT);

  return prisma.assignmentResult.create({
    data: {
      userId,
      assignmentId,
      score: 0,
      status: "IN_PROGRESS",
      questions: {
        create: selectedQuestions.map((question) => ({
          questionId: question.id,
        })),
      },
    },
    include: {
      assignment: { include: { course: true } },
      questions: { include: { question: { include: { options: true } } } },
    },
  });
}

export async function submitAssignment(
  userId: string,
  assignmentResultId: string,
  answers: SubmittedAnswer[]
) {
  const result = await prisma.assignmentResult.findUnique({
    where: { id: assignmentResultId },
    include: {
      assignment: {
        include: {
          course: { include: { skills: { include: { skill: true } } } },
        },
      },
      questions: { include: { question: { include: { options: true } } } },
    },
  });

  if (!result) throw new Error("Assignment result not found");
  if (result.userId !== userId) throw new Error("You cannot submit this assignment result");
  if (result.status === "COMPLETED") throw new Error("This assignment result is already completed");

  const selectedQuestions = result.questions.map((item) => item.question);
  const validQuestionIds = new Set(selectedQuestions.map((question) => question.id));
  if (answers.length > selectedQuestions.length) {
    throw new Error(`You can only answer ${selectedQuestions.length} selected questions`);
  }

  for (const answer of answers) {
    if (!validQuestionIds.has(answer.questionId)) {
      throw new Error("One or more answers do not belong to this exam attempt");
    }
  }

  await prisma.studentAnswer.deleteMany({ where: { assignmentResultId } });
  await prisma.studentAnswer.createMany({
    data: answers.map((answer) => ({
      assignmentResultId,
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
    })),
  });

  const selectedOptionIds = new Set(answers.map((answer) => answer.selectedOptionId));
  const correct = selectedQuestions.reduce((count, question) => {
    const selectedCorrectOption = question.options.find(
      (option) => option.isCorrect && selectedOptionIds.has(option.id)
    );
    return selectedCorrectOption ? count + 1 : count;
  }, 0);

  const total = selectedQuestions.length;
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);
  const passed = score >= result.assignment.passingScore;

  const updatedResult = await prisma.assignmentResult.update({
    where: { id: assignmentResultId },
    data: {
      score,
      status: "COMPLETED",
      completedAt: new Date(),
    },
    include: {
      assignment: {
        include: {
          course: { include: { skills: { include: { skill: true } } } },
        },
      },
      answers: true,
    },
  });

  const courseSkills = result.assignment.course.skills.map((courseSkill) => courseSkill.skill);

  if (passed) {
    await prisma.$transaction(
      courseSkills.map((skill) =>
        prisma.userSkill.upsert({
          where: {
            userId_skillId: {
              userId,
              skillId: skill.id,
            },
          },
          create: {
            userId,
            skillId: skill.id,
            completionStatus: true,
          },
          update: { completionStatus: true },
        })
      )
    );
  }

  const courseId = result.assignment.courseId;
  let certificate = null;
  let enrollment = null;

  if (courseId) {
    const materialCount = await prisma.material.count({ where: { courseId } });
    const enrollmentUpdate = passed
      ? { progress: 100, completedMaterials: materialCount }
      : {};

    enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      create: {
        userId,
        courseId,
        progress: passed ? 100 : 0,
        completedMaterials: passed ? materialCount : 0,
      },
      update: enrollmentUpdate,
    });

    if (passed) {
      certificate = await prisma.$transaction(async (tx) => {
        const savedCertificate = await tx.certificate.upsert({
          where: {
            userId_courseId: {
              userId,
              courseId,
            },
          },
          create: { userId, courseId },
          update: {},
        });

        await tx.certificateSkill.deleteMany({
          where: { certificateId: savedCertificate.id },
        });

        if (courseSkills.length > 0) {
          await tx.certificateSkill.createMany({
            data: courseSkills.map((skill) => ({
              certificateId: savedCertificate.id,
              skillId: skill.id,
            })),
            skipDuplicates: true,
          });
        }

        return tx.certificate.findUniqueOrThrow({
          where: { id: savedCertificate.id },
          include: {
            course: true,
            skills: { include: { skill: true } },
          },
        });
      });
    }
  }

  return {
    result: updatedResult,
    score,
    correct,
    total,
    passed,
    awardedSkills: passed ? courseSkills : [],
    certificate,
    enrollment,
  };
}

export async function getUserLearningProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      userSkills: { include: { skill: true } },
      certificates: { include: { course: true, skills: { include: { skill: true } } } },
      enrollments: { include: { course: true } },
      assignmentResults: {
        include: {
          assignment: {
            include: {
              course: { include: { skills: { include: { skill: true } } } },
            },
          },
        },
      },
    },
  });
}

export async function getJobMatchesForUser(userId: string) {
  const userSkills = await prisma.userSkill.findMany({
    where: { userId, completionStatus: true },
    select: { skillId: true },
  });
  const userSkillIds = new Set(userSkills.map((userSkill) => userSkill.skillId));

  const jobs = await prisma.job.findMany({
    include: {
      employer: { select: { id: true, fullName: true, email: true } },
      jobSkills: { include: { skill: true } },
    },
  });

  return jobs.map((job) => {
    const requiredSkillIds = job.jobSkills.map((jobSkill) => jobSkill.skillId);
    const matchedSkills = job.jobSkills.filter((jobSkill) => userSkillIds.has(jobSkill.skillId));
    const matchPercentage = requiredSkillIds.length === 0
      ? 0
      : Math.round((matchedSkills.length / requiredSkillIds.length) * 100);

    return {
      ...job,
      matched: requiredSkillIds.length > 0 && matchedSkills.length === requiredSkillIds.length,
      matchPercentage,
      matchedSkills: matchedSkills.map((jobSkill) => jobSkill.skill),
      missingSkills: job.jobSkills
        .filter((jobSkill) => !userSkillIds.has(jobSkill.skillId))
        .map((jobSkill) => jobSkill.skill),
    };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage);
}
