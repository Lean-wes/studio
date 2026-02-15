import { cn } from "@/lib/utils";

const SpaceBackground = () => (
  <div className="fixed top-0 left-0 -z-10 h-full w-full bg-gradient-radial from-[#1b2735] to-[#090a0f]">
    <div className="absolute inset-0 stars-shadow animate-star-anim" />
    <div className="absolute inset-0 stars2-shadow animate-star-anim-slow" />
    <div className="absolute inset-0 stars3-shadow animate-star-anim-very-slow" />
  </div>
);

export default SpaceBackground;
