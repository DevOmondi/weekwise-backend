const { User } = require("../models");

const createUser = async (
  dbUsername,
  email,
  goal,
  subscriptionId,
  scheduledMessages,
  subscriptionDate,
  nextMessageDate,
  isSubscribed,
  subscriptionStatus
  
) => {
  const user = await User.create({
    name: dbUsername,
    email: email.toLowerCase(),
    prompt: goal,
    subscriptionId: subscriptionId,
    scheduled_messages: scheduledMessages,
    subscriptionDate: subscriptionDate,
    nextMessageDate: nextMessageDate,
    isSubscribed: isSubscribed,
    subscriptionStatus: subscriptionStatus
  });
  
  console.log(user.toJSON());
  return user;
};

module.exports = createUser;