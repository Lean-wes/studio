import { PlaceHolderImages, type ImagePlaceholder } from './placeholder-images';

export type Reward = {
  id: number;
  scoreNeeded: number;
  title: string;
  description: string;
  image: ImagePlaceholder;
  video: string;
  unlocked: boolean;
};

const placeholderImagesMap = new Map(PlaceHolderImages.map(p => [p.id, p]));

export const rewards: Reward[] = [
    {
        id: 1,
        scoreNeeded: 500,
        title: "Rookie Astronaut",
        description: "You've completed your first space mission!",
        image: placeholderImagesMap.get('reward-1')!,
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        unlocked: false
    },
    {
        id: 2,
        scoreNeeded: 1500,
        title: "Lunar Explorer",
        description: "You've reached lunar orbit. Impressive!",
        image: placeholderImagesMap.get('reward-2')!,
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        unlocked: false
    },
    {
        id: 3,
        scoreNeeded: 3000,
        title: "Mars Conqueror",
        description: "The red planet is yours. You are a legend!",
        image: placeholderImagesMap.get('reward-3')!,
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        unlocked: false
    },
    {
        id: 4,
        scoreNeeded: 5000,
        title: "Galactic Master",
        description: "You have mastered deep space. Incredible!",
        image: placeholderImagesMap.get('reward-4')!,
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        unlocked: false
    },
    {
        id: 5,
        scoreNeeded: 8000,
        title: "Universe God",
        description: "You are the most powerful being in the cosmos.",
        image: placeholderImagesMap.get('reward-5')!,
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        unlocked: false
    }
];
