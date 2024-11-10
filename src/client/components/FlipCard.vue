<template>
  <div class="flip" @click="toggleFlip" :class="{ 'is-flipped': isFlipped }">
    <div class="flip-content">
      <div class="front">
        <div class="content-wrapper">
          <h2 class="text-shadow">{{ frontTitle }}</h2>
          <div class="description-container">
            <p class="description" :class="{ 'expanded': isExpanded }">{{ frontDescription }}</p>
            <button v-if="isOverflowing && !isExpanded" @click.stop="expandDescription" class="show-more-btn">
              Show More
            </button>
          </div>
        </div>
        <div class="flip-indicator">
          <i class="fas fa-redo"></i>
          <span>Click to flip</span>
        </div>
      </div>
      <div class="back">
        <h3>{{ backTitle }}</h3>
        <div class="back-content">
          <p><strong>Event ID:</strong> {{ eventId }}</p>
          <p><strong>Start Date:</strong> {{ startDate }}</p>
          <p><strong>End Date:</strong> {{ endDate }}</p>
        </div>
        <slot name="backActions"></slot>
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
    frontDescription: {
      type: String,
      required: true
    },
    backTitle: {
      type: String,
      required: true
    },
    eventId: {
      type: String,
      required: true
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      isFlipped: false,
      isExpanded: false,
      isOverflowing: false
    }
  },
  methods: {
    toggleFlip() {
      this.isFlipped = !this.isFlipped
    },
    expandDescription(event) {
      event.stopPropagation()
      this.isExpanded = true
    },
    checkOverflow() {
      const descriptionElement = this.$el.querySelector('.description')
      this.isOverflowing = descriptionElement.scrollHeight > descriptionElement.clientHeight
    }
  },
  mounted() {
    this.$nextTick(this.checkOverflow)
    window.addEventListener('resize', this.checkOverflow)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkOverflow)
  }
}
</script>

<style scoped>
.flip {
  background-color: transparent;
  width: 100%;
  height: 100%;
  perspective: 1000px;
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

.flip.is-flipped .flip-content {
  transform: rotateY(180deg);
}

.front, .back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.front {
  background-color: #3498db;
  color: white;
}

.back {
  background-color: #2ecc71;
  color: white;
  transform: rotateY(180deg);
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100% - 40px);
  width: 100%;
}

.description-container {
  position: relative;
  width: 100%;
  max-height: 60%;
  overflow: hidden;
}

.description {
  max-height: 4.5em; /* Approximately 3 lines of text */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  transition: max-height 0.3s ease;
}

.description.expanded {
  max-height: none;
  -webkit-line-clamp: unset;
}

.show-more-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: rgba(52, 152, 219, 0.8);
  color: white;
  border: none;
  padding: 2px 5px;
  font-size: 0.8em;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.show-more-btn:hover {
  background-color: rgba(52, 152, 219, 1);
}

.back-content {
  text-align: left;
  width: 100%;
}

.back-content p {
  margin-bottom: 5px;
}

h2, h3 {
  margin-bottom: 10px;
}

.text-shadow {
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.flip-indicator {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  font-size: 0.8em;
  opacity: 0.7;
}

.flip-indicator i {
  margin-right: 5px;
}
</style>