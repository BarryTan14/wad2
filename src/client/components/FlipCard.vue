<template>
  <div 
    class="flip-card" 
    @click="toggleFlip" 
    :class="{ 'is-flipped': isFlipped, 'full-width': needsFullWidth }"
    :style="{ height: cardHeight }"
  >
    <div class="flip-card-inner">
      <!-- Front side -->
      <div class="flip-card-front">
        <div class="flip-card-content" ref="frontContent">
          <div class="content-center">
            <h3 class="flip-card-title"><span style="color:#6f42c1">{{ frontTitle }}</span></h3>
            <div class="description-wrapper">
              <p 
                class="flip-card-description" 
                ref="description"
              >
                {{ frontDescription }}
              </p>
            </div>
          </div>
          <div class="flip-indicator">
            <i class="fas fa-sync-alt fa-spin-hover"></i>
            <span>Click to flip</span>
          </div>
        </div>
      </div>

      <!-- Back side -->
      <div class="flip-card-back">
        <div class="flip-card-content" ref="backContent">
          <h3 class="flip-card-title"><span style="color:#6f42c1">{{ backTitle }}</span></h3>
          <div class="event-details">
            <div class="detail-container">
              <div class="detail-item event-id">
                <div class="detail-label">
                  <i class="fas fa-hashtag"></i>
                  <span>Event ID</span>
                </div>
                <div class="detail-value id-value">{{ eventId }}</div>
              </div>
              
              <div class="time-details">
                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-calendar-day"></i>
                    <span>Starts</span>
                  </div>
                  <div class="detail-value">{{ startDate }}</div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">
                    <i class="fas fa-calendar-check"></i>
                    <span>Ends</span>
                  </div>
                  <div class="detail-value">{{ endDate }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="action-buttons">
            <slot name="backActions"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlipCard',
  props: {
    frontTitle: String,
    frontDescription: String,
    backTitle: String,
    eventId: String,
    startDate: String,
    endDate: String
  },
  data() {
    return {
      isFlipped: false,
      isOverflowing: false,
      cardHeight: '250px',
      needsFullWidth: false
    }
  },
  methods: {
    toggleFlip() {
      this.isFlipped = !this.isFlipped
    },
    checkOverflow() {
      const element = this.$refs.description
      if (element) {
        this.isOverflowing = element.scrollHeight > element.clientHeight
      }
      
      const backContent = this.$refs.backContent
      if (backContent) {
        const backHeight = backContent.scrollHeight
        this.needsFullWidth = backHeight > 250
      }
    },
    updateCardHeight() {
      this.$nextTick(() => {
        const frontContent = this.$refs.frontContent
        const backContent = this.$refs.backContent
        if (frontContent && backContent) {
          const maxHeight = Math.max(frontContent.scrollHeight, backContent.scrollHeight)
          this.cardHeight = `${maxHeight + 20}px`
        }
      })
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.checkOverflow()
      this.updateCardHeight()
    })
    window.addEventListener('resize', () => {
      this.checkOverflow()
      this.updateCardHeight()
    })
  },
  updated() {
    this.$nextTick(() => {
      this.checkOverflow()
      this.updateCardHeight()
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateCardHeight)
  }
}
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100%;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
  cursor: pointer;
}

.flip-card:hover {
  transform: translateY(-5px);
}

.flip-card.full-width {
  width: 100%;
  flex: 0 0 100%;
  max-width: 100%;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: left;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card.is-flipped .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  padding: 1.25rem;
  overflow: hidden;
  border: 1px solid rgba(111, 66, 193, 0.2);
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
}

.flip-card:hover .flip-card-front,
.flip-card:hover .flip-card-back {
  box-shadow: 0 8px 24px rgba(111, 66, 193, 0.15);
  border-color: rgba(111, 66, 193, 0.3);
}

.flip-card-front {
  color: #2c3e50;
  background: linear-gradient(to bottom right, #ffffff, #f8f9fa);
}

.flip-card-back {
  color: #2c3e50;
  transform: rotateY(180deg);
  background: linear-gradient(to bottom right, #ffffff, #f8f9fa);
}

.flip-card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  text-align: center;
}

.content-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.flip-card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.description-wrapper {
  position: relative;
  width: 100%;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.flip-card-description {
  margin: 0;
  max-height: 4.5em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  font-size: 0.95rem;
  color: #4a5568;
}

.flip-indicator {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #6f42c1;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.flip-card:hover .flip-indicator {
  opacity: 1;
}

.event-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 0;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.time-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: rgba(111, 66, 193, 0.05);
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid rgba(111, 66, 193, 0.1);
}

.detail-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.event-id {
  background: rgba(111, 66, 193, 0.05);
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid rgba(111, 66, 193, 0.1);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6f42c1;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  min-width: 100px;
}

.detail-label i {
  color: #6f42c1;
  width: 1rem;
  text-align: center;
  font-size: 0.9rem;
}

.detail-value {
  font-size: 0.95rem;
  color: #2c3e50;
  font-weight: 500;
  text-align: right;
  word-break: break-word;
  padding-left: 0;
  flex: 1;
}

.id-value {
  font-size: 0.85rem;
  text-align: right;
}

.action-buttons {
  margin-top: 1rem;
  width: 100%;
}

.action-buttons button {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  background: #6f42c1;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  box-shadow: 0 2px 4px rgba(111, 66, 193, 0.2);
}

.action-buttons button:hover {
  background: #5a32a3;
  box-shadow: 0 4px 8px rgba(111, 66, 193, 0.3);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .flip-card {
    min-height: 200px;
  }

  .flip-card-front,
  .flip-card-back {
    padding: 1rem;
  }

  .time-details,
  .event-id {
    padding: 0.75rem;
  }

  .detail-item {
    gap: 0.5rem;
  }

  .detail-label {
    min-width: 90px;
    font-size: 0.8rem;
  }

  .detail-value {
    font-size: 0.85rem;
  }
  
  .flip-card-title {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .flip-card-description {
    font-size: 0.9rem;
  }

  .action-buttons button {
    padding: 0.625rem;
    font-size: 0.9rem;
  }
}

@media (hover: none) {
  .flip-card:hover {
    transform: none;
  }
  
  .flip-card-front,
  .flip-card-back {
    box-shadow: 0 4px 12px rgba(111, 66, 193, 0.1);
  }
}
</style>