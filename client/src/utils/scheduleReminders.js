import ReminderJob from "../models/ReminderJob.js";

export async function scheduleEventReminders({ user, event, eventType }) {
  // eventType: "workshop" | "trip"
  const start = new Date(event.startDateTime);
  if (isNaN(start.getTime())) return;

  const oneDayBefore = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const oneHourBefore = new Date(start.getTime() - 60 * 60 * 1000);

  const baseMessage =
    eventType === "workshop"
      ? `Reminder: Workshop "${event.workshopName}" is coming up`
      : `Reminder: Trip "${event.tripName}" is coming up`;

  const baseLink =
    eventType === "workshop"
      ? `/workshops` // or a details route if you have one
      : `/trips`;

  const jobs = [
    {
      userId: user._id,
      eventId: event._id,
      eventType,
      remindAt: oneDayBefore,
      kind: "1d",
      message: `${baseMessage} tomorrow at ${start.toLocaleString()}.`,
      link: baseLink,
    },
    {
      userId: user._id,
      eventId: event._id,
      eventType,
      remindAt: oneHourBefore,
      kind: "1h",
      message: `${baseMessage} in 1 hour at ${start.toLocaleTimeString()}.`,
      link: baseLink,
    },
  ];

  // Filter out reminders in the past (late registration)
  const futureJobs = jobs.filter(j => j.remindAt > new Date());

  if (!futureJobs.length) return;

  try {
    await ReminderJob.insertMany(futureJobs, { ordered: false });
  } catch (err) {
    // ignore duplicate key errors from unique index
    if (err.code !== 11000) {
      console.error("Failed to schedule reminders:", err);
    }
  }
}
