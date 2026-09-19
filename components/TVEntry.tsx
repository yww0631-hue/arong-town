"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Curtain from "./Curtain";
import FittingRoom from "./FittingRoom";
import LoadingScreen from "./LoadingScreen";
import Remote from "./Remote";
import RoomSelection from "./RoomSelection";

export type TVEntryAssets = {
  awake: string;
  standing: string;
  remote: string;
  scenes: [string, string, string, string];
  fittingRoomBg: string;
  outfitCards: [string, string, string, string];
  outfits: [string, string, string, string];
  roomImages: [string, string, string, string];
};

type Stage =
  | "idle"
  | "tv"
  | "powerRemote"
  | "snowTransition"
  | "loading"
  | "awake"
  | "standing"
  | "remote"
  | "sceneSwitching"
  | "fittingRoom"
  | "changingOutfit"
  | "roomTransition"
  | "roomSelection"
  | "resetting";

// 待机点击后的镜头推进刻意放慢，接近参考图的电影式推镜节奏。
const TV_ZOOM_MS = 1800;
const POWER_SNOW_MS = 800;
const LOADING_MS = 3000;
const WAKE_MS = 1000;
const STANDING_MS = 800;
const CHANNEL_SWITCH_MS = 650;
const OUTFIT_CHANGE_MS = 500;
const RESET_MS = 900;

const sceneNames = ["阳光阁楼", "窗边工作台", "发光椅子", "户外小桌"];

export default function TVEntry({ assets }: { assets: TVEntryAssets }) {
  const [stage, setStage] = useState<Stage>("idle");
  // 场景索引始终以 0 为初始值；hasSceneStarted 区分“场景1”和“尚未开始换台”。
  const [currentScene, setCurrentScene] = useState(0);
  const [hasSceneStarted, setHasSceneStarted] = useState(false);
  const [pendingScene, setPendingScene] = useState<number | "fittingRoom" | null>(null);
  const [currentOutfit, setCurrentOutfit] = useState(0);
  const [pendingOutfit, setPendingOutfit] = useState<number | null>(null);
  // 阶段 2 首次设为 true 后永不复位：遥控器只挂载一次并贯穿全部后续流程。
  const [showRemote, setShowRemote] = useState(false);
  // 阶段 10：选中房间索引；null 表示仍在浏览四张房间卡片。
  const [currentRoom, setCurrentRoom] = useState<number | null>(null);
  // 明确区分横向拖动与点击，避免松手时误选卡片。
  const [isDragging, setIsDragging] = useState(false);

  const hasZoomed = stage !== "idle";
  // 待机状态不再覆盖雪花，保留背景照片中原本的暗色显像管。
  const showSnow = stage === "snowTransition" || stage === "sceneSwitching" || stage === "roomTransition" || stage === "resetting";

  useEffect(() => {
    if (stage === "powerRemote") setShowRemote(true);
  }, [stage]);

  useEffect(() => {
    let delay: number | undefined;
    let next: (() => void) | undefined;

    if (stage === "tv") {
      // 点击电视后跳过开机雪花、加载和唤醒流程，推镜结束直接进入第一个 IP 场景。
      [delay, next] = [TV_ZOOM_MS, () => {
        setCurrentScene(0);
        setHasSceneStarted(true);
        setShowRemote(true);
        setStage("remote");
      }];
    }
    if (stage === "snowTransition") [delay, next] = [POWER_SNOW_MS, () => setStage("loading")];
    if (stage === "awake") [delay, next] = [WAKE_MS, () => setStage("standing")];
    if (stage === "standing") [delay, next] = [STANDING_MS, () => setStage("remote")];

    if (stage === "sceneSwitching") {
      [delay, next] = [CHANNEL_SWITCH_MS, () => {
        if (pendingScene === "fittingRoom") {
          setStage("fittingRoom");
        } else if (typeof pendingScene === "number") {
          setCurrentScene(pendingScene);
          setHasSceneStarted(true);
          setStage("remote");
        }
        setPendingScene(null);
      }];
    }

    if (stage === "changingOutfit") {
      [delay, next] = [OUTFIT_CHANGE_MS, () => {
        if (pendingOutfit !== null) setCurrentOutfit(pendingOutfit);
        setPendingOutfit(null);
        setStage("fittingRoom");
      }];
    }

    if (stage === "roomTransition") {
      [delay, next] = [CHANNEL_SWITCH_MS, () => setStage("roomSelection")];
    }

    if (stage === "resetting") {
      [delay, next] = [RESET_MS, () => {
        /*
         * 等雪花完全盖住内容后，一次性恢复所有业务状态。
         * currentScene 回到 0，hasSceneStarted 回到 false；下一轮第一次换台仍从场景 1 开始。
         */
        setCurrentScene(0);
        setHasSceneStarted(false);
        setPendingScene(null);
        setCurrentRoom(null);
        setCurrentOutfit(0);
        setPendingOutfit(null);
        setIsDragging(false);
        setCanWake(false);
        setShowRemote(false);
        setStage("idle");
      }];
    }

    if (!next || delay === undefined) return;
    const timer = window.setTimeout(next, delay);
    return () => window.clearTimeout(timer);
  }, [stage, pendingScene, pendingOutfit]);

  /** 加载条结束后不自动跳走：保留闭眼图，等待用户亲自点击唤醒。 */
  const [canWake, setCanWake] = useState(false);
  useEffect(() => {
    if (stage !== "loading") {
      setCanWake(false);
      return;
    }
    const timer = window.setTimeout(() => setCanWake(true), LOADING_MS);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const pressChannelRemote = () => {
    setPendingScene(!hasSceneStarted ? 0 : currentScene === 3 ? "fittingRoom" : currentScene + 1);
    setStage("sceneSwitching");
  };

  /**
   * 全局遥控器的唯一点击入口。
   * Remote 本身始终接收点击，因此每个阶段都有一致的 3px 按压反馈；
   * 这里只根据当前阶段决定是否推进状态机。
   */
  const pressGlobalRemote = () => {
    if (stage === "powerRemote") {
      setStage("snowTransition");
      return;
    }

    if (stage === "remote") {
      pressChannelRemote();
      return;
    }

    /*
     * 阿绒睁眼及起身的约 1.8 秒内，遥控器已经可见。
     * 用户此时按下遥控器时直接开始第一次换台，避免点击被状态机静默吞掉。
     * sceneSwitching 会覆盖尚未完成的站立定时器，旧定时器也会随 effect 清理。
     */
    if (stage === "awake" || stage === "standing") {
      pressChannelRemote();
      return;
    }

    // 在试衣间再次按遥控器：以雪花转场进入阶段 9 的选房间页面。
    if (stage === "fittingRoom" || stage === "changingOutfit") {
      setPendingOutfit(null);
      setCurrentRoom(null);
      setStage("roomTransition");
      return;
    }

    // 阶段 10 无论正在浏览卡片还是已经进入房间，都执行完整闭环重置。
    if (stage === "roomSelection") {
      setStage("resetting");
    }
  };

  const selectOutfit = (index: number) => {
    if (stage !== "fittingRoom" || index === currentOutfit) return;
    setPendingOutfit(index);
    setStage("changingOutfit");
  };

  return (
    <main className="relative h-[100svh] w-screen overflow-hidden bg-[#160d08] text-white">
      {/* 背景和电视屏幕共享同一 2048×1143 坐标系，缩放时不会错位。 */}
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-[2048/1143] h-full min-h-full min-w-full -translate-x-1/2 -translate-y-1/2"
        initial={false}
        animate={hasZoomed ? { scale: 1.42, x: "-4.8%", y: "5.5%" } : { scale: 1, x: "0%", y: "0%" }}
        transition={{ duration: TV_ZOOM_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src="/images/tv_bg.jpg" alt="摆放着复古木制电视机的房间" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />

        <div
          role={stage === "idle" ? "button" : undefined}
          tabIndex={stage === "idle" ? 0 : -1}
          aria-label={stage === "idle" ? "点击电视机" : undefined}
          onClick={() => stage === "idle" && setStage("tv")}
          onKeyDown={(event) => {
            if (stage === "idle" && (event.key === "Enter" || event.key === " ")) setStage("tv");
          }}
          className={`tv-screen-shape absolute left-[29.7%] top-[22.9%] z-10 h-[53.6%] w-[28.8%] overflow-hidden bg-[#160f0b] ${stage === "idle" ? "cursor-pointer" : "cursor-default"}`}
        >
          {/* 场景始终留在木制电视框内部。 */}
          <AnimatePresence mode="popLayout">
            {hasSceneStarted && stage !== "fittingRoom" && stage !== "changingOutfit" && (
              <motion.div
                key={`scene-${currentScene}`}
                className="absolute inset-0 bg-gradient-to-br from-[#b56c43] to-[#38241c]"
                initial={{ opacity: 0 }}
                animate={stage === "sceneSwitching" ? { opacity: 1, y: [0, "-42%", "28%", 0], scaleY: [1, 0.92, 1.08, 1], filter: ["blur(0px)", "blur(4px)", "blur(3px)", "blur(0px)"] } : { opacity: 1, y: 0, scaleY: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: CHANNEL_SWITCH_MS / 1000, ease: "easeInOut" }}
              >
                {assets.scenes[currentScene] && <img src={assets.scenes[currentScene]} alt={sceneNames[currentScene]} className="absolute inset-0 h-full w-full object-cover" />}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {(stage === "snowTransition" || stage === "loading" || stage === "awake") && (
              <LoadingScreen
                key="sleeping"
                ready={canWake || stage === "awake"}
                waking={stage === "awake"}
                awakeImage={assets.awake}
                onWake={() => canWake && setStage("awake")}
              />
            )}

            {stage === "standing" && (
              <motion.div key="standing" className="absolute inset-0 flex items-center justify-center bg-[#21160f]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {assets.standing ? <motion.img src={assets.standing} alt="起床后站立的阿绒" className="h-[82%] w-[70%] object-contain" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1, scaleY: [0.92, 1.04, 1] }} transition={{ y: { type: "spring", stiffness: 150, damping: 12 }, opacity: { duration: 0.25 }, scaleY: { duration: 0.42, ease: "easeOut" } }} /> : <CharacterPlaceholder label="站立的阿绒" />}
              </motion.div>
            )}

            {(stage === "fittingRoom" || stage === "changingOutfit" || stage === "roomTransition") && (
              <FittingRoom key="fitting-room" background={assets.fittingRoomBg} outfitCards={assets.outfitCards} outfits={assets.outfits} currentOutfit={currentOutfit} changing={stage === "changingOutfit"} onSelect={selectOutfit} />
            )}

            {(stage === "roomSelection" || stage === "resetting") && (
              <RoomSelection
                key="room-selection"
                roomImages={assets.roomImages}
                currentRoom={currentRoom}
                setCurrentRoom={setCurrentRoom}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSnow && (
              <motion.div
                key={`snow-${stage}`}
                aria-hidden="true"
                className={`tv-noise pointer-events-none absolute inset-0 z-40 ${stage === "idle" ? "tv-noise-idle" : "tv-noise-fast"}`}
                initial={{ opacity: 0 }}
                animate={stage === "idle" ? { opacity: [0.13, 0.22, 0.16, 0.3, 0.18, 0.25, 0.14] } : { opacity: [0.35, 1, 0.55, 0], filter: ["blur(0px)", "blur(1px)", "blur(7px)"] }}
                exit={{ opacity: 0, filter: "blur(12px)", scale: 1.08 }}
                transition={stage === "idle" ? { duration: 3.4, times: [0, 0.12, 0.3, 0.46, 0.68, 0.82, 1], ease: "linear", repeat: Infinity } : { duration: stage === "snowTransition" ? 0.8 : 0.65, ease: "easeInOut" }}
              />
            )}
          </AnimatePresence>

          {/* 换台错位的中点闪过扫描白线及极短黑帧。 */}
          <AnimatePresence>
            {stage === "sceneSwitching" && (
              <motion.div className="pointer-events-none absolute inset-0 z-50 bg-black" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.82, 0, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.65, times: [0, 0.35, 0.48, 0.58, 1] }}>
                <motion.div className="absolute left-0 right-0 h-[2px] bg-white shadow-[0_0_12px_white]" animate={{ top: ["10%", "88%"] }} transition={{ duration: 0.36, ease: "linear" }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <Curtain subdued={hasZoomed} />

      {/*
       * 全局持久遥控器：只由 showRemote 控制首次出现。
       * showRemote 一旦为 true 就不会变回 false，因此后续转场不会卸载 Remote。
       */}
      <AnimatePresence>
        {showRemote && <Remote key="global-remote" onPress={pressGlobalRemote} image={assets.remote} />}
      </AnimatePresence>

      <AnimatePresence>
        {stage === "idle" && <motion.p className="pointer-events-none absolute bottom-8 left-1/2 z-30 -translate-x-1/2 text-xs tracking-[0.3em] text-[#f8dfc5]/80" initial={{ opacity: 0 }} animate={{ opacity: [0.35, 0.9, 0.35] }} exit={{ opacity: 0 }} transition={{ duration: 2.2, repeat: Infinity }}>点击电视机</motion.p>}
      </AnimatePresence>

    </main>
  );
}

function CharacterPlaceholder({ label }: { label: string }) {
  return <div className="flex h-full w-full items-center justify-center"><div className="flex aspect-[3/4] h-[76%] items-center justify-center rounded-[46%] bg-[#f3a6b8]/85 px-3 text-center text-xs text-white shadow-2xl">{label}<br />请接入 standing 变量</div></div>;
}
