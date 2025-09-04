const eventTypeToImage: Record<number | 'default', string> = {
  1: 'PARTY.jpg',
  2: 'MUSIC.jpg',
  3: 'LEARNING.jpg',
  4: 'EXHIBITION.jpg',
  5: 'TRAVEL.jpg',
  6: 'SPORTS.jpg',
  7: 'GAME.jpg',
  8: 'FOOD.jpg',
  9: 'OTHER.jpg',
  default: 'OTHER.jpg',
}

export const getEventImageUrl = (eventType: number): string => {
  const base = import.meta.env.BASE_URL
  const imageFile = eventTypeToImage[eventType] || eventTypeToImage.default
  return `${base}images/events/${imageFile}`
}