"use client";

import { motion } from "framer-motion";

type RemoteProps = { onPress: () => void; disabled?: boolean; image?: string };

export default function Remote({ onPress, disabled = false, image }: RemoteProps) {
  return (
    /*
     * fixed + z-[999] 使遥控器脱离电视屏幕和所有转场容器。
     * 它从第一次挂载开始便不会因阶段变化被重新定位或覆盖。
     */
    <motion.button
      type="button"
      aria-label="按下复古遥控器切换频道"
      disabled={disabled}
      onClick={onPress}
      className="fixed bottom-[-6vh] right-[clamp(.5rem,5vw,6rem)] z-[999] cursor-pointer border-0 bg-transparent p-0 disabled:cursor-default"
      initial={{ y: 300, opacity: 0, rotateX: 40, rotateY: -20 }}
      animate={{ y: 0, opacity: 1, rotateX: 15, rotateY: -10 }}
      // 只有完成整轮体验时才会卸载；缩小淡出营造“从梦中醒来”的感觉。
      exit={{ y: 24, opacity: 0, scale: 0.8, transition: { duration: 0.55, ease: "easeInOut" } }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      whileHover={disabled ? undefined : { y: -5, scale: 1.015 }}
      whileTap={disabled ? undefined : { y: 3, scale: 0.985, filter: "drop-shadow(0 8px 6px rgba(0,0,0,.35))" }}
      style={{ perspective: 900, transformStyle: "preserve-3d", filter: "drop-shadow(0 24px 18px rgba(0,0,0,.55))" }}
    >
      {/* 只有遥控器，绝不渲染手或模拟手指。 */}
      <img src={image || "/images/remote-cutout.png"} alt="带数字键的老式遥控器" draggable={false} className="h-[clamp(17rem,52vh,38rem)] w-auto select-none object-contain" />
    </motion.button>
  );
}
