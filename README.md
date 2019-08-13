# Collision

This is my first p5.js sketch that combines generative visuals with generative music. On the physics side, I used elastic collision to simulate the balls bouncing off each other, and musically I used a reordered chromatic scale, a very basic use of a 12-tone row, as that seemed like an interesting way to give it more structure than completely random notes, without limiting the possibilities harmonically.

## The Rules

- When the page loads, the chromatic scale (C, C#, D, ...B) is shuffled into a random order. This is our sequence of notes. 
- Balls appear with a random direction and speed, with a randomly assigned note from the shuffled chromatic scale sequence, and a randomly assigned octave. The ball's hue is determined by the note; size is determined by the octave.
- If a ball bounces off another ball, or the edge of a screen, the note plays and the ball increments to the next note in the sequence, and so to the corresponding hue.
- When the ball has completed the sequence, it disappears.
- Another ball is added one second after the last one was added (if there aren't enough balls on screen), or one second after the last one was removed.
- Clicking on the screen adds another ball at the cursor position.
- Maximum starting speed and ball sizes are determined by the window size, to avoid things getting too cluttered or sparse.
- It's in stereo too: the note's pan level at each bounce is set by the position of the ball.

## Thankyous

- [p5.js](p5.js)
- Wikipedia: [Elastic Collision](https://en.wikipedia.org/wiki/Elastic_collision)
- [Adam Brookes' Elastic Collision Code in JS](http://cobweb.cs.uga.edu/~maria/classes/4070-Spring-2017/Adam%20Brookes%20Elastic%20collision%20Code.pdf)
- One Lone Coder's [Programming Balls](https://www.youtube.com/watch?v=LPzyNOHY3A4) video

## Todo
- [ ] Mass. It's hard-coded to equal 1 regardless of radius for now.