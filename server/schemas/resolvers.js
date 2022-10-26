const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
	Query: {
		me: async (parent, args, context) => {
			if (context.user) {
				const userData = await User.findOne({ _id: context.user_id })
					.select("__v -password")
					.populate("books");
				return userData;
			}
			throw new AuthenticationError("You are not logged in!");
		},
	},
	Mutation: {
		addUser: async (parent, args) => {
			const user = await User.create(args);
			const token = signToken(user);
			return { token, user };
		},
		login: async (parent, { email, password }) => {
			const user = await User.findOne({ email });

			if (!user) {
				throw new AuthenticationError("No user found with that email");
			}

			const correctPw = await user.isCorrectPassword(password);

			if (!correctPw) {
				throw new AuthenticationError("Incorrect password");
			}
			const token = signToken(user);
			return { token, user };
		},
		saveBook: async (parent, { newBook }, context) => {
			if (context.user) {
				const updatedUser = await User.findByIdAndUpdate(
					{ _id: context.user._id },
					{ $push: { books: newBook } },
					{ new: true }
				);
				return updatedUser;
			}
			throw new AuthenticationError("Log in to add books!");
		},

		removeBook: async (parent, { bookId }, context) => {
			if (context.user) {
				const updatedUser = await User.findByIdAndUpdate(
					{ _id: context.user._id },
					{ $pull: { books: { bookId } } },
					{ new: true }
				);
				return updatedUser;
			}
			throw new AuthenticationError("You need to be logged in!");
		},
	},
};

module.exports = resolvers;
