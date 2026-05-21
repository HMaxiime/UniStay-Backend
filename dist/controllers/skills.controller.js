import prisma from "../config/prisma.js";
import { createSkillSchema } from "../validators/skills.validator.js";
export async function getSkills(req, res) {
    try {
        const skills = await prisma.skill.findMany();
        res.json(skills);
    }
    catch (error) {
        console.error("Error fetching skills:", error);
        res.status(500).json({ error: "Failed to fetch skills" });
    }
}
export async function getSkillById(req, res) {
    try {
        const skillId = req.params.id;
        const skill = await prisma.skill.findUnique({ where: { id: skillId } });
        if (!skill) {
            return res.status(404).json({ error: "Skill not found" });
        }
        res.json(skill);
    }
    catch (error) {
        console.error("Error fetching skill:", error);
        res.status(500).json({ error: "Failed to fetch skill" });
    }
}
export async function createSkill(req, res) {
    try {
        const parsed = createSkillSchema.parse(req.body);
        const skill = await prisma.skill.create({ data: parsed });
        res.status(201).json(skill);
    }
    catch (error) {
        console.error("Error creating skill:", error);
        res.status(500).json({ error: "Failed to create skill" });
    }
}
export async function deleteSkill(req, res) {
    try {
        const skillId = req.params.id;
        await prisma.skill.delete({ where: { id: skillId } });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting skill:", error);
        res.status(500).json({ error: "Failed to delete skill" });
    }
}
export async function updateSkill(req, res) {
    try {
        const skillId = req.params.id;
        const parsed = createSkillSchema.parse(req.body);
        const skill = await prisma.skill.update({
            where: { id: skillId },
            data: parsed,
        });
        res.json(skill);
    }
    catch (error) {
        console.error("Error updating skill:", error);
        res.status(500).json({ error: "Failed to update skill" });
    }
}
//# sourceMappingURL=skills.controller.js.map