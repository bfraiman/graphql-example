const bcrypt = require("bcryptjs");

const Event = require("../../models/event");
const User = require("../../models/user");
const Booking = require("../../models/booking");

const findEventById = async eventId => {
  try {
    const event = await Event.findById(eventId);

    return { ...event._doc, _id: event.id, creator: findUserById.bind(this, event._doc.creator) };
  } catch (error) {
    throw error;
  }
};

const findEventsByIds = async eventsIdArray => {
  try {
    const events = await Event.find({ _id: { $in: eventsIdArray } });

    return events.map(event => ({
      ...event._doc,
      _id: event.id,
      creator: findUserById.bind(this, event._doc.creator)
    }));
  } catch (error) {
    throw error;
  }
};

const findUserById = async userId => {
  try {
    const user = await User.findById(userId);

    return { ...user._doc, _id: user.id, createdEvents: findEventsByIds.bind(this, user._doc.createdEvents) };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  bookings: async () => {
    try {
      const bookings = await Booking.find();

      return bookings.map(booking => ({
        ...booking._doc,
        _id: booking.id,
        user: findUserById.bind(this, booking._doc.user),
        event: findEventById.bind(this, booking._doc.event),
        createdAt: new Date(booking._doc.createdAt),
        updatedAt: new Date(booking._doc.updatedAt)
      }));
    } catch (error) {
      throw error;
    }
  },
  events: async () => {
    try {
      const events = await Event.find();

      return events.map(event => ({
        ...event._doc,
        _id: event.id,
        creator: findUserById.bind(this, event._doc.creator)
      }));
    } catch (error) {
      throw error;
    }
  },
  bookEvent: async args => {
    try {
      const fetchedEvent = await Event.findOne({ _id: args.eventId });

      const booking = new Booking({
        user: "5d8f9c54221a073d557291ca",
        event: fetchedEvent
      });

      const result = await booking.save();

      return {
        ...result._doc,
        _id: result.id,
        user: findUserById.bind(this, booking._doc.user),
        event: findEventById.bind(this, booking._doc.event),
        createdAt: new Date(result._doc.createdAt).toISOString(),
        updatedAt: new Date(result._doc.updatedAt).toISOString()
      };
    } catch (error) {
      throw error;
    }
  },
  cancelBooking: async args => {
    try {
      const booking = await Booking.findById(args.bookingId).populate("event");

      const event = {
        ...booking.event._doc,
        _id: booking.eventId,
        creator: findUserById.bind(this, booking.event._doc.creator)
      };

      await Booking.deleteOne({ _id: args.bookingId });

      return event;
    } catch (error) {
      throw error;
    }
  },
  createEvent: async args => {
    const event = new Event({
      title: args.eventInput.title,
      description: args.eventInput.description,
      price: +args.eventInput.price,
      date: new Date(),
      creator: "5d8f9c54221a073d557291ca"
    });

    let createdEvent;

    try {
      const result = await event.save();

      createdEvent = { ...result._doc, _id: event.id, creator: findUserById.bind(this, result._doc.creator) };

      const user = await User.findById("5d8f9c54221a073d557291ca");

      if (!user) {
        throw new Error("User not found");
      }

      user.createdEvents.push(event);

      await user.save();

      return createdEvent;
    } catch (error) {
      throw error;
    }
  },
  createUser: async args => {
    try {
      const existingUser = await User.findOne({ email: args.userInput.email });

      if (existingUser) {
        throw new Error("Email already exists");
      }

      const hashedPassword = await bcrypt.hash(args.userInput.password, 12);

      const user = new User({
        email: args.userInput.email,
        name: args.userInput.name,
        lastName: args.userInput.lastName,
        password: hashedPassword
      });

      const result = await user.save();

      return { ...result._doc, _id: user.id, password: null };
    } catch (error) {
      throw error;
    }
  }
};
