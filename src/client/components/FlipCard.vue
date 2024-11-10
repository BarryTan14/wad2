<template>
    <div class="flip flip-vertical" @click="toggleFlip" :class="{ 'is-flipped': isFlipped }">
      <div class="flip-content">
        <div class="front">
          <h2 class="text-shadow">{{ frontTitle }}</h2>
        </div>
        <div class="back">
          <h3>{{ backTitle }}</h3>
          <p>{{ backContent }}</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'FlipCard',
    props: {
      frontTitle: {
        type: String,
        required: true
      },
      backTitle: {
        type: String,
        required: true
      },
      backContent: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        isFlipped: false
      }
    },
    methods: {
      toggleFlip() {
        this.isFlipped = !this.isFlipped
      }
    }
  }
  </script>
  
  <style scoped>
  .flip {
    background-color: transparent;
    width: 300px;
    height: 200px;
    perspective: 1000px;
    margin: 10px;
    cursor: pointer;
  }
  
  .flip-content {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }
  
  .is-flipped .flip-content {
    transform: rotateY(180deg);
  }
  
  .front, .back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    border: 2px solid #3498db;
    background-color: #2c3e50;
    color: white;
  }
  
  .back {
    transform: rotateY(180deg);
    background-color: #34495e;
  }
  
  h2, h3 {
    margin: 0 0 10px 0;
  }
  
  p {
    font-size: 0.9em;
    line-height: 1.4;
  }
  
  .text-shadow {
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  }
  </style>