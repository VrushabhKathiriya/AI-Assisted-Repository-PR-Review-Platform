export const TOPICS = {
  PR_REVIEW_EVENTS:    "pr-review-events",      // AI review pipeline
  PR_LIFECYCLE_EVENTS: "pr-lifecycle-events"     // Notifications
};


/* ---------- EVENT TYPES ----------
   These are the specific event names inside each topic.
   
   Think of it like:
     Topic = a channel
     EventType = the specific type of content published to that channel

   pr-review-events topic can have:
     PR_REVIEW_REQUESTED → someone submitted a PR, trigger AI review

   pr-lifecycle-events topic can have:
     PR_CREATED  → notify repo owner
     PR_ACCEPTED → notify PR creator
     PR_REJECTED → notify PR creator
------------------------------------------------ */

export const EVENTS = {
  // goes to pr-review-events topic
  PR_REVIEW_REQUESTED: "PR_REVIEW_REQUESTED",

  // goes to pr-lifecycle-events topic
  PR_CREATED:          "PR_CREATED",
  PR_ACCEPTED:         "PR_ACCEPTED",
  PR_REJECTED:         "PR_REJECTED",

  //  Comment notification → notify PR creator when someone comments
  COMMENT_ADDED:        "COMMENT_ADDED",
  //  Invitation notifications → notify repo owner
  INVITATION_ACCEPTED:  "INVITATION_ACCEPTED",
  INVITATION_DECLINED:  "INVITATION_DECLINED"
};
