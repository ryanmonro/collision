// This is cool, but...
/* heading back to the original idea at the museum:
it could draw the squares gradually, drawing one per draw() call
and play a note on each one
mouse position still determines proportion of colours
you will hear the difference more than see it
10 calls per second, 5 seconds per line
if it's too tedious let's draw multiple lines simultaneously
when the grid is full, start again from the top without clearing
Next question: what happens on mobile?
*/

'use strict';

var width = 500
var height = 500
var synth
var sloop

function setup() {
  synth = new p5.PolySynth();
  createCanvas(500, 500);
  background(0)
  frameRate(30)
  colorMode(HSB, 360, 100, 100);
  sloop = new p5.SoundLoop(soundLoop, 0.125)
}

function soundLoop(time){
  // synth.play(note, 0.1, 0, 0.1);
}

function draw() {
  
}

function mousePressed() {
  getAudioContext().resume()
}

function mouseClicked() {
  if (sloop.isPlaying) {
    sloop.pause();
  } else {
    sloop.start();
  }
}

function keyPressed(){
  if (key == 's' || key == 'S') saveCanvas(gd.timestamp(), 'png');
}