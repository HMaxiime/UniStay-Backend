export const createNotification = async (payload: {
  userId?: string
  type?: string
  title?: string
  message?: string
  data?: unknown
}) => {
  // Temporary no-op notification service.
  // Replace with proper persistence or push logic when a Notification model exists.
  console.info('createNotification:', payload)
  return Promise.resolve()
}
