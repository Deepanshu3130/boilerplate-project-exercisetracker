const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config()

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect('mongodb+srv://deepanshujoshi199:Deepanshu%40123@deepanshu.mnlev.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });

// Define the User Schema and Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }
});
const exerciseSchema = new mongoose.Schema({
  userId: 
  { type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  try {
      const newUser = new User({ username });
      await newUser.save();
      res.json({ username: newUser.username, _id: newUser._id });
  } catch (err) {
      res.status(500).json({ error: 'User creation failed' });
  }
});


app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  try {
      const user = await User.findById(_id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const exercise = new Exercise({
          userId: user._id,
          description,
          duration: parseInt(duration),
          date: date ? new Date(date) : new Date()
      });
      await exercise.save();

      res.json({
          username: user.username,
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString(),
          _id: user._id
      });
  } catch (err) {
      res.status(500).json({ error: 'Exercise creation failed' });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
      const user = await User.findById(_id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      let filter = { userId: _id };
      if (from || to) {
          filter.date = {};
          if (from) filter.date.$gte = new Date(from);
          if (to) filter.date.$lte = new Date(to);
      }

      const exercises = await Exercise.find(filter).limit(parseInt(limit)).exec();

      res.json({
          _id: user._id,
          username: user.username,
          count: exercises.length,
          log: exercises.map(ex => ({
              description: ex.description,
              duration: ex.duration,
              date: ex.date.toDateString()
          }))
      });
  } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
