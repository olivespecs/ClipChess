import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createFreshState, encodeState, isValidPayload, decodeState, PlayerColor } from "@/lib/chess-state";

export default function Home() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [color, setColor] = useState<PlayerColor>("white");
  const [pasteString, setPasteString] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedName = sessionStorage.getItem("clipchess_player_name");
    if (savedName) setName(savedName);
  }, []);

  const handleStartNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    
    sessionStorage.setItem("clipchess_player_name", name);
    const state = createFreshState(name, color);
    sessionStorage.setItem("clipchess_game_state", JSON.stringify(state));
    setLocation("/game");
  };

  const handleLoadGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteString.trim()) {
      setError("Please paste a game string");
      return;
    }
    
    if (!isValidPayload(pasteString)) {
      setError("Invalid game string");
      return;
    }
    
    const state = decodeState(pasteString);
    
    if (!name.trim()) {
      setError("Name is required to join a game");
      return;
    }
    
    sessionStorage.setItem("clipchess_player_name", name);
    sessionStorage.setItem("clipchess_game_state", JSON.stringify(state));
    setLocation("/game");
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-background via-background to-black">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-primary tracking-tight">ClipChess</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">The asynchronous chess club</p>
        </div>

        <div className="space-y-8 bg-card border border-border p-8 rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none mix-blend-overlay"></div>
          
          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kasparov"
                className="bg-background/50 font-serif text-lg h-12 border-border/50 focus-visible:ring-primary/50"
                data-testid="input-player-name"
              />
            </div>

            <div className="h-[1px] bg-border/50 w-full" />

            <form onSubmit={handleStartNew} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Start New Game</Label>
                <RadioGroup value={color} onValueChange={(v) => setColor(v as PlayerColor)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="white" id="r1" />
                    <Label htmlFor="r1" className="cursor-pointer">Play White</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="black" id="r2" />
                    <Label htmlFor="r2" className="cursor-pointer">Play Black</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full font-serif text-lg h-12" data-testid="button-start-game">
                Create Match
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <form onSubmit={handleLoadGame} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paste" className="text-xs uppercase tracking-wider text-muted-foreground">Resume Game</Label>
                <Input
                  id="paste"
                  value={pasteString}
                  onChange={(e) => setPasteString(e.target.value)}
                  placeholder="Paste ClipChess_... string here"
                  className="bg-background/50 font-mono text-xs h-12 border-border/50 focus-visible:ring-primary/50"
                  data-testid="input-paste-string"
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full font-serif text-lg h-12" data-testid="button-load-game">
                Load & Play
              </Button>
            </form>
          </div>
        </div>

        {error && (
          <div className="text-center text-destructive text-sm font-medium animate-in fade-in" data-testid="text-error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
