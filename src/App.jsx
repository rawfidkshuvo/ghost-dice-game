import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  increment,
} from "firebase/firestore";
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Ghost,
  Skull,
  Trophy,
  LogOut,
  History,
  BookOpen,
  X,
  Crown,
  User,
  RotateCcw,
  Home,
  CheckCircle,
  AlertTriangle,
  Gavel,
  Megaphone,
  Hammer,
  Sparkles,
  Trash2, // Added Trash2 icon
} from "lucide-react";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBjIjK53vVJW1y5RaqEFGSFp0ECVDBEe1o",
  authDomain: "game-hub-ff8aa.firebaseapp.com",
  projectId: "game-hub-ff8aa",
  storageBucket: "game-hub-ff8aa.firebasestorage.app",
  messagingSenderId: "586559578902",
  appId: "1:586559578902:web:590c84080a05dcfd6aa637",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "ghost-dice";
const GAME_ID = "7";

// --- Constants ---
const DICE_ICONS = {
  1: Dice1,
  2: Dice2,
  3: Dice3,
  4: Dice4,
  5: Dice5,
  6: Dice6,
};

// --- Sub-Components (Strict DNA adherence) ---

const FloatingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full bg-indigo-900/10 mix-blend-overlay" />
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage:
          'url("https://www.transparenttextures.com/patterns/black-scales.png")',
      }}
    ></div>
  </div>
);

const GhostLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Ghost size={12} className="text-indigo-400" />
    <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
      GHOST DICE
    </span>
  </div>
);

const LeaveConfirmModal = ({
  onConfirmLeave,
  onConfirmLobby,
  onCancel,
  isHost,
  inGame,
}) => (
  <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Abandon the Haunt?</h3>
      <p className="text-zinc-400 mb-6 text-sm">
        {inGame
          ? "Leaving now will forfeit your soul (and the game)."
          : "Leaving the lobby will disconnect you."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay
        </button>
        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Home size={18} /> Return Group to Lobby
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-900/80 hover:bg-red-800 text-red-200 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 border border-red-900"
        >
          <LogOut size={18} /> Leave Game
        </button>
      </div>
    </div>
  </div>
);

const LogViewer = ({ logs, onClose }) => (
  <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-0 md:p-4">
    <div className="bg-zinc-900 w-full md:max-w-md h-full md:h-[70vh] rounded-none md:rounded-xl flex flex-col border-none md:border border-zinc-700 shadow-2xl">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <History size={18} className="text-indigo-400" /> Séance Logs
        </h3>
        <button
          onClick={onClose}
          className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700"
        >
          <X className="text-zinc-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[...logs].reverse().map((log, i) => (
          <div
            key={i}
            className={`text-xs md:text-sm p-3 rounded border-l-2 ${
              log.type === "danger"
                ? "bg-red-900/10 border-red-500 text-red-300"
                : log.type === "success"
                ? "bg-green-900/10 border-green-500 text-green-300"
                : log.type === "warning"
                ? "bg-indigo-900/10 border-indigo-500 text-indigo-300"
                : "bg-zinc-800/50 border-zinc-600 text-zinc-400"
            }`}
          >
            <span className="opacity-50 mr-2 font-mono">
              [
              {new Date(parseInt(log.id)).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
              ]
            </span>
            {log.text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-0 md:p-4 animate-in fade-in">
    <div className="bg-zinc-900 md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border-none md:border border-indigo-500/30 flex flex-col">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wider">
          <BookOpen className="text-indigo-400" /> The Grimoire
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400"
        >
          <X />
        </button>
      </div>
      <div className="p-6 overflow-y-auto text-zinc-300 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
            <h3 className="text-xl font-bold text-indigo-400 mb-2">
              The Basics
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                Everyone starts with <strong>5 Dice</strong>.
              </li>
              <li>
                Only <strong>you</strong> can see your own dice.
              </li>
              <li>Goal: Be the last player with dice remaining.</li>
              <li>
                <strong>1s (Aces) are Wild!</strong> They count as any number,
                unless the bid is on 1s.
              </li>
            </ul>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
            <h3 className="text-xl font-bold text-white mb-2">
              Bidding & Challenging
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Bid:</strong> Claim a quantity of a specific face value
                on the <em>entire table</em> (e.g., "Five 4s").
              </li>
              <li>
                <strong>Raise:</strong> You must bid a higher quantity OR the
                same quantity with a higher face value.
              </li>
              <li>
                <strong>Liar!:</strong> If you don't believe the previous bid,
                challenge it!
              </li>
              <li>
                <strong>Result:</strong> If the bid was valid, Challenger loses
                a die. If invalid, Bidder loses a die.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none">
    <div
      className={`
      flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] 
      transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300
      backdrop-blur-md
      ${
        type === "success"
          ? "bg-indigo-900/90 border-indigo-500 text-indigo-100"
          : ""
      }
      ${type === "failure" ? "bg-red-900/90 border-red-500 text-red-100" : ""}
      ${type === "neutral" ? "bg-zinc-800/90 border-zinc-500 text-white" : ""}
    `}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-black/30 rounded-full border-2 border-white/20">
          <Icon size={64} className="animate-bounce" />
        </div>
      )}
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-center drop-shadow-lg mb-2">
        {message}
      </h2>
      {subtext && (
        <p className="text-lg md:text-xl font-bold opacity-90 tracking-wide text-center">
          {subtext}
        </p>
      )}
    </div>
  </div>
);

// --- Main Component ---
export default function GhostDiceGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isMaintenance, setIsMaintenance] = useState(false);

  // UI States
  const [showRules, setShowRules] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Input State
  const [bidQuantity, setBidQuantity] = useState(1);
  const [bidFace, setBidFace] = useState(2);

  // --- Auth & Listener ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.players.some((p) => p.id === user.uid)) {
            setRoomId("");
            setView("menu");
            setError("Connection Terminated.");
            return;
          }
          setGameState(data);

          if (data.status === "lobby") setView("lobby");
          else setView("game");

          // Feedback Trigger
          if (
            data.feedbackTrigger &&
            data.feedbackTrigger.id !== gameState?.feedbackTrigger?.id
          ) {
            setFeedback(data.feedbackTrigger);
            setTimeout(() => setFeedback(null), 3000);
          }

          // Auto update inputs to be valid next bid if not set
          if (data.currentBid && !gameState?.currentBid) {
            setBidQuantity(data.currentBid.quantity);
            setBidFace(data.currentBid.face);
          }
        } else {
          setRoomId("");
          setView("menu");
          setError("Room vanished into the ether.");
        }
      }
    );
    return () => unsub();
  }, [roomId, user, gameState?.feedbackTrigger?.id]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
        setIsMaintenance(true);
      else setIsMaintenance(false);
    });
    return () => unsub();
  }, []);

  // --- Game Actions ---

  const createRoom = async () => {
    if (!playerName.trim()) return setError("Name required.");
    setLoading(true);
    const newId = Math.random().toString(36).substring(2, 7).toUpperCase();

    const initialData = {
      roomId: newId,
      hostId: user.uid,
      status: "lobby",
      players: [
        {
          id: user.uid,
          name: playerName,
          dice: [], // Will generate on start
          diceCount: 5,
          eliminated: false,
          ready: true,
        },
      ],
      logs: [],
      turnIndex: 0,
      currentBid: null,
      turnState: "IDLE", // BIDDING, REVEAL
      feedbackTrigger: null,
      winner: null,
    };

    try {
      await setDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
        initialData
      );
      setRoomId(newId);
      setView("lobby");
    } catch (e) {
      setError("Network error.");
    }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName)
      return setError("Code and Name required.");
    setLoading(true);
    try {
      const ref = doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "rooms",
        roomCodeInput
      );
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Room not found.");
      const data = snap.data();
      if (data.status !== "lobby") throw new Error("Game already in progress.");
      if (data.players.length >= 6) throw new Error("Table full.");

      if (!data.players.find((p) => p.id === user.uid)) {
        await updateDoc(ref, {
          players: arrayUnion({
            id: user.uid,
            name: playerName,
            dice: [],
            diceCount: 5,
            eliminated: false,
            ready: true,
          }),
        });
      }
      setRoomId(roomCodeInput);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const leaveRoom = async () => {
    if (!roomId) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);

    // Check if I am host
    const isHost = gameState.hostId === user.uid;

    if (isHost) {
      // If host leaves, delete the room entirely
      // Listeners for other players will see doc removed and kick them to menu
      await deleteDoc(ref);
    } else {
      // Guest leaving
      const updatedPlayers = gameState.players.filter((p) => p.id !== user.uid);
      await updateDoc(ref, { players: updatedPlayers });
    }

    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
  };

  // --- KICK FUNCTION ---
  const kickPlayer = async (playerIdToRemove) => {
    if (gameState.hostId !== user.uid) return;

    const newPlayers = gameState.players.filter(
      (p) => p.id !== playerIdToRemove
    );

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: newPlayers }
    );
  };

  // --- READY TOGGLE FUNCTION ---
  const toggleReady = async () => {
    if (!gameState) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: !p.ready } : p
    );
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: updatedPlayers }
    );
  };

  // --- Logic ---

  const rollDice = (count) => {
    const res = [];
    for (let i = 0; i < count; i++) res.push(Math.floor(Math.random() * 6) + 1);
    return res.sort();
  };

  const startGame = async () => {
    if (gameState.players.length < 2) return setError("Need 2+ Players.");

    // Init Players
    const players = gameState.players.map((p) => ({
      ...p,
      diceCount: 5,
      dice: rollDice(5),
      eliminated: false,
      ready: false, // Reset readiness on start
    }));

    // Random Start
    const startIdx = Math.floor(Math.random() * players.length);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players: players,
        turnIndex: startIdx,
        currentBid: null,
        turnState: "BIDDING",
        logs: [
          {
            id: Date.now().toString(),
            text: "The Haunt Begins. 5 Dice each.",
            type: "neutral",
          },
        ],
      }
    );
  };

  const placeBid = async () => {
    const current = gameState.currentBid;
    const me = gameState.players.find((p) => p.id === user.uid);

    // Validation
    if (current) {
      if (bidQuantity < current.quantity) return; // Invalid
      if (bidQuantity === current.quantity && bidFace <= current.face) return; // Invalid
    }

    // Calc next turn
    let nextIdx = (gameState.turnIndex + 1) % gameState.players.length;
    while (gameState.players[nextIdx].eliminated)
      nextIdx = (nextIdx + 1) % gameState.players.length;

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        currentBid: {
          quantity: bidQuantity,
          face: bidFace,
          playerId: user.uid,
          playerName: me.name,
        },
        turnIndex: nextIdx,
        logs: arrayUnion({
          id: Date.now().toString(),
          text: `${me.name} bids: ${bidQuantity}x ${bidFace}s`,
          type: "neutral",
        }),
      }
    );
  };

  const challenge = async () => {
    const bid = gameState.currentBid;
    const challenger = gameState.players.find((p) => p.id === user.uid);
    const bidder = gameState.players.find((p) => p.id === bid.playerId);

    // 1. Reveal Phase: Count Dice
    // 1s are wild unless bid face is 1
    let count = 0;
    let allDice = [];

    gameState.players.forEach((p) => {
      if (!p.eliminated) {
        allDice = [...allDice, ...p.dice];
        p.dice.forEach((d) => {
          if (d === bid.face || (d === 1 && bid.face !== 1)) {
            count++;
          }
        });
      }
    });

    const bidSuccess = count >= bid.quantity;
    const loserId = bidSuccess ? challenger.id : bidder.id;
    const loserName = bidSuccess ? challenger.name : bidder.name;

    // Update logs and state for Reveal
    let logs = [
      {
        id: Date.now().toString(),
        text: `Liar! ${challenger.name} challenges ${bidder.name}.`,
        type: "warning",
      },
      {
        id: Date.now() + 1,
        text: `Reveal: Found ${count} matching dice. Bid was ${
          bidSuccess ? "VALID" : "FALSE"
        }.`,
        type: bidSuccess ? "success" : "danger",
      },
      { id: Date.now() + 2, text: `${loserName} loses a die!`, type: "danger" },
    ];

    // Update Feedback
    const feedback = {
      id: Date.now(),
      type: bidSuccess ? "failure" : "success", // From challenger perspective: if bid success, challenger fails
      message: bidSuccess ? "BID VALID" : "BID FAILED",
      subtext: `${count} found vs ${bid.quantity} bid. ${loserName} loses die.`,
    };

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        turnState: "REVEAL",
        feedbackTrigger: feedback,
        logs: arrayUnion(...logs),
      }
    );

    // 2. Resolve (Delay)
    setTimeout(async () => {
      const players = [...gameState.players];
      const lIdx = players.findIndex((p) => p.id === loserId);

      players[lIdx].diceCount -= 1;

      let logText = "";
      let nextState = "BIDDING";
      let winner = null;

      if (players[lIdx].diceCount <= 0) {
        players[lIdx].eliminated = true;
        logText = `${players[lIdx].name} has run out of soul. Eliminated.`;
      }

      // Check Win Condition
      const alive = players.filter((p) => !p.eliminated);
      if (alive.length === 1) {
        nextState = "FINISHED";
        winner = alive[0].name;
      }

      // Reroll everyone who is alive
      players.forEach((p) => {
        if (!p.eliminated) p.dice = rollDice(p.diceCount);
        else p.dice = [];
      });

      // Winner of challenge (or survivor) goes next.
      // If loser eliminated, next alive person goes.
      let nextIdx = lIdx;
      if (players[lIdx].eliminated) {
        nextIdx = (lIdx + 1) % players.length;
        while (players[nextIdx].eliminated && activePlayers > 1)
          nextIdx = (nextIdx + 1) % players.length;
      }

      let updates = {
        players: players,
        turnState: nextState === "FINISHED" ? "IDLE" : "BIDDING",
        currentBid: null,
        turnIndex: nextIdx,
      };

      if (logText) {
        updates.logs = arrayUnion({
          id: Date.now().toString(),
          text: logText,
          type: "danger",
        });
      }

      if (winner) {
        updates.status = "finished";
        updates.winner = winner;
        updates.feedbackTrigger = {
          id: Date.now(),
          type: "success",
          message: "VICTORY",
          subtext: `${winner} Survives!`,
        };
      }

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        updates
      );
    }, 4000); // 4 Second Reveal
  };

  const returnToLobby = async () => {
    const resetPlayers = gameState.players.map((p) => ({
      ...p,
      dice: [],
      diceCount: 5,
      eliminated: false,
      ready: true,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players: resetPlayers,
        logs: [],
        currentBid: null,
        turnState: "IDLE",
        winner: null,
        feedbackTrigger: null,
      }
    );
  };

  const me = gameState?.players.find((p) => p.id === user?.uid);
  const isMyTurn = gameState?.players[gameState?.turnIndex]?.id === user?.uid;

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            The spirits are resting. The tavern is closed until dusk.
          </p>
        </div>
        {/* Add Spacing Between Boxes */}
        <div className="h-8"></div>

        {/* Clickable Second Card */}
        <a href="https://rawfidkshuvo.github.io/gamehub/">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 rounded-full border border-indigo-500/20 text-indigo-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm">
                <Sparkles size={16} /> Visit Gamehub...Try our other releases...{" "}
                <Sparkles size={16} />
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  }

  // --- Views ---

  if (!user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-indigo-500 animate-pulse">
        Summoning...
      </div>
    );

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}

        <div className="z-10 text-center mb-10 animate-in fade-in zoom-in duration-700">
          <Ghost
            size={64}
            className="text-indigo-400 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-indigo-300 to-zinc-500 font-serif tracking-widest drop-shadow-md">
            GHOST DICE
          </h1>
          <p className="text-zinc-500 tracking-[0.3em] uppercase mt-2">
            Dead Men Tell No Tales
          </p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur border border-indigo-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom-10 duration-700 delay-100">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}

          <input
            className="w-full bg-black/50 border border-zinc-600 p-3 rounded mb-4 text-white placeholder-zinc-500 focus:border-indigo-500 outline-none transition-colors"
            placeholder="Soul Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-700 to-zinc-600 hover:from-indigo-600 hover:to-zinc-500 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all"
          >
            <Crown size={20} /> Host Séance
          </button>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-zinc-600 p-3 rounded text-white placeholder-zinc-500 uppercase font-mono tracking-wider focus:border-indigo-500 outline-none"
              placeholder="CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-6 py-3 rounded font-bold transition-colors"
            >
              Join
            </button>
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="w-full text-sm text-zinc-400 hover:text-white flex items-center justify-center gap-2 py-2"
          >
            <BookOpen size={16} /> The Grimoire
          </button>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
            inGame={false}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-zinc-900/90 backdrop-blur p-8 rounded-2xl border border-indigo-900/50 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-8 border-b border-zinc-700 pb-4">
            <h2 className="text-2xl font-serif text-indigo-400">
              Crypt: <span className="text-white font-mono">{roomId}</span>
            </h2>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded text-red-300"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="bg-black/20 rounded-xl p-4 mb-8 border border-zinc-800">
            <h3 className="text-zinc-500 text-xs uppercase tracking-wider mb-4 flex justify-between">
              <span>Souls ({gameState.players.length})</span>
            </h3>
            <div className="space-y-2">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-zinc-800/50 p-3 rounded border border-zinc-700/50"
                >
                  <span
                    className={`font-bold flex items-center gap-2 ${
                      p.id === user.uid ? "text-indigo-400" : "text-zinc-300"
                    }`}
                  >
                    <User size={14} /> {p.name}{" "}
                    {p.id === gameState.hostId && (
                      <Crown size={14} className="text-yellow-500" />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-xs flex items-center gap-1">
                      <CheckCircle size={12} /> Present
                    </span>
                    {/* --- KICK BUTTON --- */}
                    {isHost && p.id !== user.uid && (
                      <button
                        onClick={() => kickPlayer(p.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors"
                        title="Kick Soul"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {gameState.players.length < 2 && (
                <div className="text-center text-zinc-500 italic text-sm py-2">
                  Waiting for more souls...
                </div>
              )}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 2}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                gameState.players.length >= 2
                  ? "bg-indigo-700 hover:bg-indigo-600 text-white shadow-indigo-900/20"
                  : "bg-zinc-800 cursor-not-allowed text-zinc-500"
              }`}
            >
              {gameState.players.length < 2
                ? "Need 2+ Players..."
                : "Begin Haunt"}
            </button>
          ) : (
            <div className="text-center text-indigo-400/60 animate-pulse font-serif italic">
              Waiting for Host...
            </div>
          )}
        </div>
        <GhostLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />

        {/* Overlays */}
        {feedback && (
          <FeedbackOverlay
            type={feedback.type}
            message={feedback.message}
            subtext={feedback.subtext}
            icon={feedback.type === "success" ? Gavel : Skull}
          />
        )}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        {showLogs && (
          <LogViewer logs={gameState.logs} onClose={() => setShowLogs(false)} />
        )}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={gameState.hostId === user.uid}
            onConfirmLobby={() => {
              returnToLobby();
              setShowLeaveConfirm(false);
            }}
            inGame={true}
          />
        )}

        {/* Top Bar */}
        <div className="h-14 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between px-4 z-50 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-2">
            <span className="font-serif text-indigo-500 font-bold tracking-wider hidden md:block">
              GHOST DICE
            </span>
            <span className="text-xs text-zinc-500 bg-black/50 px-2 py-1 rounded">
              Room {gameState.roomId}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="p-2 hover:bg-zinc-800 rounded text-zinc-400"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(true)}
              className="p-2 hover:bg-zinc-800 rounded text-zinc-400"
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/50 rounded text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 p-4 flex flex-col items-center relative z-10 max-w-6xl mx-auto w-full gap-4">
          {/* Table Center (Current Bid) */}
          <div className="w-full max-w-md bg-zinc-900/50 p-6 rounded-2xl border border-indigo-500/20 flex flex-col items-center justify-center min-h-[160px] animate-in fade-in zoom-in">
            <div className="text-xs text-indigo-400 uppercase tracking-widest mb-2">
              Current Bid
            </div>
            {gameState.currentBid ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                  <span className="text-6xl font-black text-white drop-shadow-lg">
                    {gameState.currentBid.quantity}
                  </span>
                  <span className="text-4xl text-zinc-500">x</span>
                  {React.createElement(DICE_ICONS[gameState.currentBid.face], {
                    size: 64,
                    className:
                      "text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]",
                  })}
                </div>
                <div className="mt-2 text-zinc-400 text-sm">
                  by{" "}
                  <span className="text-white font-bold">
                    {gameState.currentBid.playerName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-zinc-600 italic">No bids placed...</div>
            )}
          </div>

          {/* Opponents Grid */}
          <div className="flex gap-4 justify-center flex-wrap w-full my-4">
            {gameState.players.map((p, i) => {
              if (p.id === user.uid) return null;
              const isTurn = gameState.turnIndex === i;
              return (
                <div
                  key={p.id}
                  className={`
                                relative bg-zinc-900/90 p-4 rounded-xl border-2 w-32 md:w-40 transition-all flex flex-col items-center
                                ${
                                  isTurn
                                    ? "border-indigo-500 shadow-lg shadow-indigo-900/20 scale-105"
                                    : "border-zinc-700"
                                }
                                ${p.eliminated ? "opacity-40 grayscale" : ""}
                            `}
                >
                  <div className="absolute top-2 right-2 flex gap-0.5">
                    {[...Array(p.diceCount)].map((_, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400/50"
                      />
                    ))}
                  </div>

                  {p.eliminated ? (
                    <Skull size={32} className="text-red-500 mb-2" />
                  ) : (
                    <Ghost
                      size={32}
                      className={
                        isTurn
                          ? "text-indigo-400 animate-bounce"
                          : "text-zinc-600"
                      }
                    />
                  )}

                  <span
                    className={`font-bold text-sm truncate w-full text-center ${
                      isTurn ? "text-indigo-200" : "text-zinc-400"
                    }`}
                  >
                    {p.name}
                  </span>

                  {gameState.turnState === "REVEAL" && !p.eliminated && (
                    <div className="absolute inset-0 bg-black/90 rounded-xl flex items-center justify-center z-10 p-2 flex-wrap gap-1">
                      {p.dice.map((d, di) =>
                        React.createElement(DICE_ICONS[d], {
                          key: di,
                          size: 16,
                          className:
                            d === gameState.currentBid?.face || d === 1
                              ? "text-white"
                              : "text-zinc-700",
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Player Area */}
          <div
            className={`w-full max-w-2xl bg-zinc-900/95 p-4 rounded-t-3xl border-t border-indigo-500/30 backdrop-blur-md mt-auto shadow-2xl z-20 ${
              me.eliminated && gameState.status !== "finished"
                ? "grayscale opacity-50 pointer-events-none"
                : ""
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <User className="text-indigo-400" />
                <span className="font-bold text-xl">{me.name}</span>
                <div className="bg-indigo-900/30 px-3 py-1 rounded-full text-xs text-indigo-300 border border-indigo-500/30">
                  {me.diceCount} Dice Left
                </div>
              </div>
              {/* My Dice */}
              <div className="flex gap-2 bg-black/40 p-2 rounded-xl">
                {me.dice.map((d, i) => (
                  <div
                    key={i}
                    className={`
                                     bg-zinc-100 rounded-lg p-1 shadow-inner
                                     ${
                                       gameState.currentBid &&
                                       (d === gameState.currentBid.face ||
                                         d === 1)
                                         ? "ring-2 ring-yellow-500"
                                         : ""
                                     }
                                 `}
                  >
                    {React.createElement(DICE_ICONS[d], {
                      size: 32,
                      className: "text-zinc-900",
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="min-h-[100px]">
              {gameState.status === "finished" ? (
                <div className="text-center">
                  <h3 className="text-3xl font-black text-indigo-400 mb-4">
                    {gameState.winner} Wins!
                  </h3>

                  {/* READY STATUS DISPLAY */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {gameState.players.map((p) => (
                      <div
                        key={p.id}
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border ${
                          p.ready
                            ? "bg-green-900/30 border-green-500 text-green-400"
                            : "bg-zinc-800 border-zinc-600 text-zinc-500"
                        }`}
                      >
                        {p.name} {p.ready && "✓"}
                      </div>
                    ))}
                  </div>

                  {gameState.hostId === user.uid ? (
                    <div className="flex flex-col gap-2">
                      {/* Host Buttons - Disabled until all ready */}
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={startGame}
                          disabled={!gameState.players.every((p) => p.ready)}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-white flex gap-2 items-center"
                        >
                          <RotateCcw size={18} /> Restart
                        </button>
                        <button
                          onClick={returnToLobby}
                          disabled={!gameState.players.every((p) => p.ready)}
                          className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-white flex gap-2 items-center"
                        >
                          <Home size={18} /> Lobby
                        </button>
                      </div>
                      {!gameState.players.every((p) => p.ready) && (
                        <div className="text-zinc-500 text-xs animate-pulse mt-2">
                          Waiting for all souls to be ready...
                        </div>
                      )}
                      {!me.ready && (
                        <button
                          onClick={toggleReady}
                          className="text-xs text-indigo-400 hover:text-indigo-300 underline mt-2"
                        >
                          Mark Self Ready
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-xs mx-auto">
                      <button
                        onClick={toggleReady}
                        className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all mb-2 ${
                          me.ready
                            ? "bg-green-900/30 border border-green-500 text-green-400"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white"
                        }`}
                      >
                        {me.ready ? "READY" : "MARK READY"}
                      </button>
                      <div className="text-zinc-500 text-xs italic">
                        Waiting for Host...
                      </div>
                    </div>
                  )}
                </div>
              ) : isMyTurn && gameState.turnState === "BIDDING" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 items-center justify-center">
                    {/* Quantity Select */}
                    <div className="flex items-center bg-zinc-800 rounded-lg border border-zinc-700">
                      <button
                        onClick={() =>
                          setBidQuantity(Math.max(1, bidQuantity - 1))
                        }
                        className="p-3 hover:bg-zinc-700 text-zinc-400"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-bold text-xl">
                        {bidQuantity}
                      </span>
                      <button
                        onClick={() => setBidQuantity(bidQuantity + 1)}
                        className="p-3 hover:bg-zinc-700 text-white"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-zinc-500">x</span>
                    {/* Face Select */}
                    <div className="flex gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700 overflow-x-auto">
                      {[1, 2, 3, 4, 5, 6].map((face) => (
                        <button
                          key={face}
                          onClick={() => setBidFace(face)}
                          className={`p-2 rounded-md transition-all ${
                            bidFace === face
                              ? "bg-indigo-600 text-white shadow-lg"
                              : "hover:bg-zinc-700 text-zinc-500"
                          }`}
                        >
                          {React.createElement(DICE_ICONS[face], { size: 24 })}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={placeBid}
                      disabled={
                        gameState.currentBid &&
                        (bidQuantity < gameState.currentBid.quantity ||
                          (bidQuantity === gameState.currentBid.quantity &&
                            bidFace <= gameState.currentBid.face))
                      }
                      className="col-span-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-zinc-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                    >
                      <Megaphone size={20} /> Place Bid
                    </button>
                    <button
                      onClick={challenge}
                      disabled={!gameState.currentBid}
                      className="bg-red-900/80 hover:bg-red-800 disabled:opacity-50 disabled:bg-zinc-800 text-red-200 py-4 rounded-xl font-bold text-lg shadow-lg border border-red-700 flex items-center justify-center gap-2"
                    >
                      <Gavel size={20} /> LIAR!
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-zinc-500 animate-pulse py-8">
                  {gameState.turnState === "REVEAL"
                    ? "Resolving Challenge..."
                    : `Waiting for ${
                        gameState.players[gameState.turnIndex]?.name
                      }...`}
                </div>
              )}
            </div>
          </div>
        </div>
        <GhostLogo />
      </div>
    );
  }

  return null;
}
