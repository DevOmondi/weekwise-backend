const { User } = require("../models");

const createUser = async (
  name,
  email,
  goal,
  paymentID,
  scheduledMessages,
  subscriptionDate,
  nextMessageDate
) => {
  const user = await User.create({
    name: name,
    email: email.toLowerCase(),
    prompt: goal,
    paymentID: paymentID,
    scheduled_messages: scheduledMessages,
    subscriptionDate: subscriptionDate,
    nextMessageDate: nextMessageDate,
  });
  
  console.log(user.toJSON());
  return user;
};

module.exports = createUser;