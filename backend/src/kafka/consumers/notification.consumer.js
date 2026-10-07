import kafka from "../../config/kafka.js";
import { TOPICS, EVENTS } from "../topics.js";
import { Notification } from "../../models/notification.model.js";

/* ---------- NOTIFICATION CONSUMER ----------
     groupId = "notification-consumer-group"
     Separate from AI review consumer group — each group tracks
     its own offset (position) independently in the topic.
------------------------------------------------ */

const consumer = kafka.consumer({
  groupId: "notification-consumer-group"
});

export const startNotificationConsumer = async () => {

  /* Step 1: Connect to Kafka broker */
  await consumer.connect();
  console.log("Notification Consumer connected to Kafka");

  /* Step 2: Subscribe to pr-lifecycle-events topic */
  await consumer.subscribe({
    topic: TOPICS.PR_LIFECYCLE_EVENTS,
    fromBeginning: false
  });

  /* Step 3: Start listening — runs FOREVER
     eachMessage fires for every new event in "pr-lifecycle-events"

     message.value is raw bytes from Kafka:
       .toString() → readable string  → JSON.parse() → JS object
  */
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {

      const event = JSON.parse(message.value.toString());

      console.log(`Notification Consumer: Received [${event.eventType}]`);

      /* ---------- PR_CREATED → notify the repo owner ---------- */
      if (event.eventType === EVENTS.PR_CREATED) {

        /* Don't notify yourself (same guard as original createNotification.js) */
        if (event.repoOwnerId === event.createdBy) {
          console.log("Notification Consumer: Skipping — owner created their own PR");
          return;
        }

        await Notification.create({
          recipient:   event.repoOwnerId,   
          sender:      event.createdBy,      
          type:        "pr_created",
          message:     `${event.username} created a new PR on file ${event.fileName}`,
          repository:  event.repoId,
          pullRequest: event.prId
        });

        console.log(`Notification Consumer: PR_CREATED notification saved`);
      }

      /* ---------- PR_ACCEPTED → notify the PR creator ---------- */
      if (event.eventType === EVENTS.PR_ACCEPTED) {

        await Notification.create({
          recipient:   event.prCreatorId,       
          sender:      event.reviewedBy,         
          type:        "pr_accepted",
          message:     `Your PR was accepted by ${event.reviewerUsername}`,
          repository:  event.repoId,
          pullRequest: event.prId
        });

        console.log(`Notification Consumer: PR_ACCEPTED notification saved`);
      }

      /* ---------- PR_REJECTED → notify the PR creator ---------- */
      if (event.eventType === EVENTS.PR_REJECTED) {

        await Notification.create({
          recipient:   event.prCreatorId,       
          sender:      event.reviewedBy,          
          type:        "pr_rejected",
          message:     `Your PR was rejected by ${event.reviewerUsername}`,
          repository:  event.repoId,
          pullRequest: event.prId
        });

        console.log(`Notification Consumer: PR_REJECTED notification saved`);
      }

      if (event.eventType === EVENTS.COMMENT_ADDED) {
        /* Don't notify yourself if you comment on your own PR */
        if (event.prCreatorId === event.commenterId) {
          console.log("Notification Consumer: Skipping — user commented on their own PR");
          return;
        }
        await Notification.create({
          recipient:   event.prCreatorId,           // PR creator gets notified
          sender:      event.commenterId,            // person who commented
          type:        "comment_added",
          message:     `${event.commenterUsername} commented on your PR`,
          repository:  event.repoId,
          pullRequest: event.prId
        });
        console.log(`Notification Consumer: COMMENT_ADDED notification saved`);
      }
      
      //---------- INVITATION_ACCEPTED  ----------
        if (event.eventType === EVENTS.INVITATION_ACCEPTED) {
        await Notification.create({
          recipient:  event.repoOwnerId,             // repo owner gets notified
          sender:     event.acceptedByUserId,         // contributor who accepted
          type:       "contributor_added",
          message:    `${event.acceptedByUsername} accepted your invitation to ${event.repoName}`,
          repository: event.repoId
        });
        console.log(`Notification Consumer: INVITATION_ACCEPTED notification saved`);
      }
      
      // ---------- INVITATION_DECLINED  ----------
      if (event.eventType === EVENTS.INVITATION_DECLINED) {
        await Notification.create({
          recipient:  event.repoOwnerId,             // repo owner gets notified
          sender:     event.declinedByUserId,         // contributor who declined
          type:       "contributor_removed",
          message:    `${event.declinedByUsername} declined your invitation to ${event.repoName}`,
          repository: event.repoId
        });
        console.log(`Notification Consumer: INVITATION_DECLINED notification saved`);
      }


    }
  });
};
