const { User } = require("../models");

const createUser = async (userName, userEmail, prompt, previousMessages) => {
  const user = await User.create({
    name: userName,
    email: userEmail.toLowerCase(),
    prompt: prompt,
    previous_messages: previousMessages,
  });
  console.log(user.toJSON());
};

module.exports = createUser;
