import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameState, encodeState, decodeState, isValidPayload } from "@/lib/chess-state";
import { isMyTurn, isGameOver, getTurn, applyMove, getLegalMovesFrom, needsPromotion, getCapturedPieces, getMoveHistory, getLastMoveSquares, isInCheck, getKingSquare } from "@/lib/chess-logic";
import { Copy, Check, Flag, Handshake } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const LIGHT_SQUARE = "#eeeed2";
const DARK_SQUARE = "#769656";

export default function Game() {
  const [, setLocation] = useLocation();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myName, setMyName] = useState("");
  const [copied, setCopied] = useState(false);
  const [pasteString, setPasteString] = useState("");
  const [error, setError] = useState("");
  
  // Board interaction state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  
  // Promotion state
  const [promotionMove, setPromotionMove] = useState<{from: string, to: string} | null>(null);

  useEffect(() => {
    const savedName = sessionStorage.getItem("clipchess_player_name");
    const savedStateStr = sessionStorage.getItem("clipchess_game_state");
    
    if (!savedName || !savedStateStr) {
      setLocation("/");
      return;
    }
    
    setMyName(savedName);
    try {
      setGameState(JSON.parse(savedStateStr));
    } catch {
      setLocation("/");
    }
  }, [setLocation]);

  const updateState = (newState: GameState) => {
    setGameState(newState);
    sessionStorage.setItem("clipchess_game_state", JSON.stringify(newState));
  };

  const handleCopy = async () => {
    if (!gameState) return;
    const str = encodeState(gameState);
    try {
      await navigator.clipboard.writeText(str);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = str;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPayload(pasteString)) {
      setError("Invalid game string");
      return;
    }
    setError("");
    const newState = decodeState(pasteString);
    updateState(newState);
    setPasteString("");
  };

  const handleSquareClick = (square: string) => {
    if (!gameState || isGameOver(gameState)) return;
    if (!isMyTurn(gameState, myName)) return;

    // If a piece is already selected and we click a legal destination
    if (selectedSquare) {
      const moveUciPrefix = selectedSquare + square;
      const isLegalDestination = legalMoves.some(m => m.startsWith(moveUciPrefix));
      
      if (isLegalDestination) {
        if (needsPromotion(gameState.fen, selectedSquare, square)) {
          setPromotionMove({ from: selectedSquare, to: square });
          return;
        } else {
          executeMove(moveUciPrefix);
          return;
        }
      }
    }

    // Otherwise, select the square and get legal moves if any
    const moves = getLegalMovesFrom(gameState.fen, square);
    if (moves.length > 0) {
      setSelectedSquare(square);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const executeMove = (uci: string) => {
    if (!gameState) return;
    
    const result = applyMove(gameState.fen, uci);
    let newStatus = gameState.status;
    
    if (result.isCheckmate) newStatus = "checkmate";
    else if (result.isStalemate) newStatus = "stalemate";
    else if (result.isDraw) newStatus = "draw_accepted";
    
    // Clear any draw offers if a move is made
    if (newStatus === "draw_offered") newStatus = "active";
    
    const newState: GameState = {
      ...gameState,
      fen: result.newFen,
      history: [...gameState.history, uci],
      last_move: uci,
      status: newStatus
    };
    
    setSelectedSquare(null);
    setLegalMoves([]);
    setPromotionMove(null);
    updateState(newState);
  };

  const handleResign = () => {
    if (!gameState || isGameOver(gameState)) return;
    updateState({ ...gameState, status: "resigned" });
  };

  const handleOfferDraw = () => {
    if (!gameState || isGameOver(gameState)) return;
    updateState({ ...gameState, status: "draw_offered" });
  };

  const handleAcceptDraw = () => {
    if (!gameState || isGameOver(gameState)) return;
    updateState({ ...gameState, status: "draw_accepted" });
  };

  if (!gameState) return null;

  const myColor = gameState.players.white.toLowerCase() === myName.toLowerCase() ? "white" : "black";
  const opponentName = myColor === "white" ? gameState.players.black : gameState.players.white;
  const myTurn = isMyTurn(gameState, myName);
  const over = isGameOver(gameState);
  
  const ranksToRender = myColor === "black" ? [...RANKS].reverse() : RANKS;
  const filesToRender = myColor === "black" ? [...FILES].reverse() : FILES;

  const lastMoveSquares = getLastMoveSquares(gameState.last_move);
  const isCheck = isInCheck(gameState.fen);
  const kingSquare = isCheck ? getKingSquare(gameState.fen) : null;
  const captured = getCapturedPieces(gameState.history);
  
  // My captured pieces are what I have taken from the opponent
  const myCaptured = myColor === "white" ? captured.byWhite : captured.byBlack;
  const oppCaptured = myColor === "white" ? captured.byBlack : captured.byWhite;

  const getPieceSymbol = (fen: string, sq: string) => {
    const fenBoard = fen.split(" ")[0];
    const rows = fenBoard.split("/");
    const rankIdx = 8 - parseInt(sq[1]);
    const fileIdx = sq.charCodeAt(0) - 'a'.charCodeAt(0);
    
    const row = rows[rankIdx];
    let currentFile = 0;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (isNaN(parseInt(char))) {
        if (currentFile === fileIdx) return { char, id: `${char}-${sq}` };
        currentFile++;
      } else {
        currentFile += parseInt(char);
      }
    }
    return null;
  };

  const pieceUnicodeMap: Record<string, string> = {
    'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
    'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
  };

  const renderStatus = () => {
    if (gameState.status === "checkmate") return "Checkmate";
    if (gameState.status === "stalemate") return "Stalemate";
    if (gameState.status === "draw_accepted") return "Draw";
    if (gameState.status === "resigned") return `${myTurn ? opponentName : myName} Resigned`;
    if (gameState.status === "draw_offered") return myTurn ? "Draw Offered" : "You Offered Draw";
    if (isCheck) return "Check";
    return "Active";
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background text-foreground font-sans">
      <header className="p-4 border-b border-border/50 flex justify-between items-center bg-card shadow-md relative z-10">
        <div className="font-serif font-bold text-2xl text-primary cursor-pointer tracking-tight" onClick={() => setLocation("/")}>
          ClipChess
        </div>
        <div className="text-sm font-serif text-muted-foreground flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="uppercase text-[10px] tracking-widest opacity-60">White</span>
            <span className={myColor === 'white' ? 'text-primary font-bold' : ''}>{gameState.players.white}</span>
          </div>
          <span className="opacity-30">vs</span>
          <div className="flex flex-col items-start">
            <span className="uppercase text-[10px] tracking-widest opacity-60">Black</span>
            <span className={myColor === 'black' ? 'text-primary font-bold' : ''}>{gameState.players.black}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 grid lg:grid-cols-[1fr_350px] gap-8 items-start relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none" />
        
        <div className="flex flex-col items-center space-y-6 relative z-10">
          
          <div className="w-full flex justify-between items-end px-2">
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold text-muted-foreground">{opponentName}</span>
              <div className="flex gap-1 text-primary text-xl h-6">
                {oppCaptured.map((p, i) => <span key={i}>{p}</span>)}
              </div>
            </div>
            
            {gameState.status === "draw_offered" && myTurn && (
              <Button size="sm" variant="secondary" onClick={handleAcceptDraw} className="h-8" data-testid="button-accept-draw">
                <Handshake className="w-4 h-4 mr-2" /> Accept Draw
              </Button>
            )}
          </div>
          
          <div className="w-full max-w-[600px] aspect-square rounded-sm overflow-hidden border-[12px] border-[#2a221b] shadow-2xl relative ring-1 ring-white/10">
            <div className="w-full h-full grid grid-cols-8 grid-rows-8 bg-[#2a221b]">
              {ranksToRender.map((rank) => (
                filesToRender.map((file) => {
                  const sq = file + rank;
                  const isLight = (file.charCodeAt(0) + parseInt(rank)) % 2 !== 0;
                  const bgColor = isLight ? LIGHT_SQUARE : DARK_SQUARE;
                  
                  const isLastMove = lastMoveSquares?.includes(sq);
                  const isSelected = selectedSquare === sq;
                  const isLegalDest = legalMoves.some(m => m.startsWith(selectedSquare + sq));
                  const isKingInCheck = sq === kingSquare;
                  
                  const pieceData = getPieceSymbol(gameState.fen, sq);

                  return (
                    <div 
                      key={sq}
                      data-testid={`square-${sq}`}
                      className="relative flex items-center justify-center cursor-pointer select-none"
                      style={{ backgroundColor: bgColor }}
                      onClick={() => handleSquareClick(sq)}
                    >
                      {/* Highlight last move */}
                      {isLastMove && <div className="absolute inset-0 bg-[#f6f669] opacity-40 pointer-events-none" />}
                      
                      {/* Highlight selected */}
                      {isSelected && <div className="absolute inset-0 bg-primary opacity-60 mix-blend-multiply pointer-events-none" />}
                      
                      {/* Highlight check */}
                      {isKingInCheck && <div className="absolute inset-0 bg-destructive opacity-70 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />}
                      
                      {/* Legal move dot */}
                      {isLegalDest && (
                        <div className="absolute w-[25%] h-[25%] rounded-full bg-black/25 pointer-events-none" />
                      )}

                      {/* Piece */}
                      <AnimatePresence>
                        {pieceData && (
                          <motion.div 
                            key={pieceData.id}
                            layoutId={`piece-${pieceData.char}-${sq}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="relative z-10 text-[6.5cqw] leading-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" 
                            style={{ color: pieceData.char === pieceData.char.toUpperCase() ? '#ffffff' : '#111111' }}
                          >
                            {pieceUnicodeMap[pieceData.char]}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Coordinates (bottom/left edges) */}
                      {file === filesToRender[0] && (
                        <span className="absolute top-1 left-1 text-[10px] font-mono font-bold opacity-50 pointer-events-none" style={{ color: isLight ? DARK_SQUARE : LIGHT_SQUARE }}>{rank}</span>
                      )}
                      {rank === ranksToRender[ranksToRender.length - 1] && (
                        <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold opacity-50 pointer-events-none" style={{ color: isLight ? DARK_SQUARE : LIGHT_SQUARE }}>{file}</span>
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          <div className="w-full flex justify-between items-start px-2">
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold text-foreground">{myName}</span>
              <div className="flex gap-1 text-primary text-xl h-6">
                {myCaptured.map((p, i) => <span key={i}>{p}</span>)}
              </div>
            </div>
            
            <div className="flex gap-2">
              {!over && myTurn && (
                <>
                  <Button size="sm" variant="ghost" onClick={handleResign} className="text-muted-foreground hover:text-destructive" data-testid="button-resign">
                    <Flag className="w-4 h-4 mr-2" /> Resign
                  </Button>
                  {gameState.status !== "draw_offered" && (
                    <Button size="sm" variant="ghost" onClick={handleOfferDraw} className="text-muted-foreground" data-testid="button-offer-draw">
                      <Handshake className="w-4 h-4 mr-2" /> Offer Draw
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          
          <div className="bg-card border border-border p-6 rounded-lg shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="flex justify-between items-end mb-6">
              <h3 className="font-serif font-bold text-xl text-primary tracking-tight">Status</h3>
              <span className="font-mono text-sm uppercase font-bold text-muted-foreground tracking-widest">{renderStatus()}</span>
            </div>
            
            {over ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-4 bg-muted/50 rounded border border-border/50 text-center">
                  <p className="text-lg font-serif font-bold text-foreground mb-1">Match Concluded</p>
                  <p className="text-sm text-muted-foreground">{renderStatus()}</p>
                </div>
                <Button onClick={() => setLocation("/")} className="w-full font-serif text-lg h-12" data-testid="button-new-game">
                  Start New Game
                </Button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {myTurn
                      ? gameState.history.length === 0
                        ? "1. Send this to your opponent, then make your move"
                        : "2. Send this to your opponent"
                      : "Waiting for opponent — paste their reply below"}
                  </p>
                  <div className="relative">
                    <Input
                      readOnly
                      value={encodeState(gameState)}
                      className="font-mono text-[10px] pr-12 bg-background/80 border-primary/30 h-12 text-primary/80 cursor-copy"
                      onClick={handleCopy}
                      data-testid="input-current-state"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={handleCopy}
                      data-testid="button-copy-state"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-xs text-primary font-mono animate-in fade-in">Copied to clipboard</p>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-border/30">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {myTurn ? "Or load opponent's reply" : "Paste opponent's reply"}
                  </p>
                  <form onSubmit={handlePasteSubmit} className="flex gap-2">
                    <Input
                      value={pasteString}
                      onChange={e => { setPasteString(e.target.value); setError(""); }}
                      placeholder="ClipChess_..."
                      className="font-mono text-xs bg-background/50 h-10"
                      data-testid="input-receive-move"
                    />
                    <Button type="submit" className="h-10 px-6" data-testid="button-load-move">Load</Button>
                  </form>
                  {error && <p className="text-xs text-destructive font-bold">{error}</p>}
                </div>

              </div>
            )}
          </div>

          <div className="bg-card border border-border p-6 rounded-lg shadow-xl flex-1 overflow-hidden flex flex-col min-h-[300px]">
            <h3 className="font-serif font-bold text-xl mb-6 text-primary tracking-tight">Ledger</h3>
            <div className="overflow-y-auto flex-1 font-mono text-sm space-y-1 pr-4 custom-scrollbar">
              {getMoveHistory(gameState.history).map((turn, i) => (
                <div key={i} className="flex gap-4 py-1.5 px-2 hover:bg-white/5 rounded transition-colors group">
                  <span className="text-muted-foreground/50 w-6 text-right group-hover:text-primary/50 transition-colors">{turn.move}.</span>
                  <span className="w-16 font-medium text-foreground/90">{turn.white}</span>
                  <span className="w-16 font-medium text-foreground/90">{turn.black}</span>
                </div>
              ))}
              {gameState.history.length === 0 && (
                <div className="h-full flex items-center justify-center text-muted-foreground/50 italic font-serif text-sm">
                  The board is set.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={!!promotionMove} onOpenChange={() => setPromotionMove(null)}>
        <DialogContent className="sm:max-w-[400px] border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-primary">Promote Pawn</DialogTitle>
            <DialogDescription>Choose a piece to replace your pawn.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-around py-8">
            {['q', 'r', 'b', 'n'].map(piece => (
              <button
                key={piece}
                className="text-6xl hover:text-primary transition-colors p-4 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/30"
                onClick={() => {
                  if (promotionMove) {
                    executeMove(promotionMove.from + promotionMove.to + piece);
                  }
                }}
              >
                <span className="drop-shadow-lg" style={{ color: myColor === "white" ? '#ffffff' : '#111111' }}>
                  {myColor === "white" ? pieceUnicodeMap[piece.toUpperCase()] : pieceUnicodeMap[piece]}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
