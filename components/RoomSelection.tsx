"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type Dispatch, type SetStateAction, useRef } from "react";

type RoomSelectionProps = {
  roomImages: [string, string, string, string];
  currentRoom: number | null;
  setCurrentRoom: Dispatch<SetStateAction<number | null>>;
  isDragging: boolean;
  setIsDragging: Dispatch<SetStateAction<boolean>>;
};

const roomNames = ["阁楼画室", "手工编织房", "植物温室", "浴室"];
const placeholderColors = [
  "from-[#7f3d39] to-[#d28555]",
  "from-[#69402c] to-[#be7c42]",
  "from-[#264d3c] to-[#8a8e50]",
  "from-[#315269] to-[#82a7b2]",
];

export default function RoomSelection({
  roomImages,
  currentRoom,
  setCurrentRoom,
  isDragging,
  setIsDragging,
}: RoomSelectionProps) {
  // Framer Motion 使用可视窗口 ref 自动计算轨道的左右拖拽边界。
  const viewportRef = useRef<HTMLDivElement>(null);

  const selectRoom = (index: number) => {
    if (isDragging) return;
    setCurrentRoom(index);
  };

  return (
    <motion.section
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#563c31_0%,#261b18_50%,#120e0d_100%)]"
      initial={{ opacity: 0, filter: "blur(8px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <motion.div
        className="absolute left-[8%] top-[7%] z-10"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: currentRoom === null ? 1 : 0, y: 0 }}
      >
        <p className="text-[10px] tracking-[0.35em] text-[#f1b7aa]">SELECT A ROOM</p>
        <h2 className="mt-1 text-sm font-semibold text-[#fff3e8]">阿绒今天想去哪里？</h2>
      </motion.div>

      {/*
       * 轨道只占电视屏幕内部，不延伸到全局遥控器层。
       * Remote 的 z-index 为 999，因此拖拽区域永远不能抢走遥控器点击。
       */}
      <div ref={viewportRef} className="absolute inset-x-[6%] bottom-[8%] top-[25%] overflow-hidden">
        <motion.div
          className="flex h-full w-max items-center gap-3 px-1"
          drag={currentRoom === null ? "x" : false}
          dragConstraints={viewportRef}
          dragElastic={0.1}
          dragMomentum
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => {
            // 延迟一帧复位，确保 dragEnd 后浏览器补发的 click 被拦截。
            requestAnimationFrame(() => setIsDragging(false));
          }}
        >
          {roomNames.map((name, index) => {
            const selected = currentRoom === index;
            const hidden = currentRoom !== null && !selected;

            return (
              <motion.button
                key={name}
                type="button"
                aria-label={`进入${name}`}
                onClick={() => selectRoom(index)}
                className={`relative h-[82%] w-[clamp(9rem,62vw,15rem)] shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-gradient-to-br ${placeholderColors[index]} text-left shadow-[0_16px_35px_rgba(0,0,0,.48)] ${selected ? "border-[#ff9db5] shadow-[0_0_22px_rgba(255,125,165,.75)]" : "border-white/15"}`}
                animate={{
                  opacity: hidden ? 0 : 1,
                  scale: hidden ? 0.8 : selected ? 1.1 : 1,
                  filter: hidden ? "blur(5px)" : "blur(0px)",
                }}
                transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                whileHover={currentRoom === null ? { y: -5, scale: 1.025 } : undefined}
                whileTap={currentRoom === null ? { scale: 0.98 } : undefined}
              >
                {roomImages[index] ? (
                  <img
                    src={roomImages[index]}
                    alt={name}
                    draggable={false}
                    className="absolute inset-0 h-full w-full select-none object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[10px] text-white/65">
                    roomImages[{index}]
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
                  <span className="text-xs font-semibold tracking-[0.12em] text-white">{name}</span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* 选中后，独立的大图层从卡片尺寸扩展至屏幕主体约 80%。 */}
      <AnimatePresence>
        {currentRoom !== null && (
          <motion.div
            key={`focused-room-${currentRoom}`}
            className={`absolute inset-[9%] z-20 overflow-hidden rounded-2xl border border-[#ff9db5] bg-gradient-to-br ${placeholderColors[currentRoom]} shadow-[0_0_28px_rgba(255,125,165,.55)]`}
            initial={{ opacity: 0, scale: 0.86, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: [0.94, 1.015, 1], y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
            transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
          >
            {roomImages[currentRoom] && (
              <img src={roomImages[currentRoom]} alt={roomNames[currentRoom]} className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />
            <p className="absolute left-[5%] top-[6%] text-xs font-semibold tracking-[0.18em] text-white">{roomNames[currentRoom]}</p>

          </motion.div>
        )}
      </AnimatePresence>

    </motion.section>
  );
}
