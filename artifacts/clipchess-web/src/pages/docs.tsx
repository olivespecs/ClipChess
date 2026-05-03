import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-6 bg-primary rounded-full" />
      <h2 className="font-serif font-bold text-2xl text-foreground">{children}</h2>
    </div>
  );
}

function Terminal({ children }: { children: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border/40 shadow-lg">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-black/60 border-b border-border/30">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      </div>
      <pre className="bg-black/40 px-5 py-4 font-mono text-sm text-primary/90 overflow-x-auto leading-relaxed whitespace-pre">{children}</pre>
    </div>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <code className="inline-flex items-center bg-primary/10 border border-primary/20 text-primary rounded px-1.5 py-0.5 font-mono text-xs">
      {children}
    </code>
  );
}

function Step({
  number,
  last,
  title,
  children,
}: {
  number: number;
  last?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center z-10">
          <span className="text-sm font-bold text-primary font-mono">{number}</span>
        </div>
        {!last && <div className="w-px flex-1 bg-border/30 mt-2" />}
      </div>
      <div className={`space-y-4 ${last ? "pb-0" : "pb-10"} flex-1 min-w-0`}>
        <h3 className="font-serif font-bold text-lg text-foreground leading-tight pt-1">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm leading-relaxed">{children}</p>;
}

export default function Docs() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/90 backdrop-blur">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-foreground gap-2 -ml-2"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="text-border/60">|</span>
          <span className="font-serif font-bold text-primary">ClipChess</span>
          <span className="text-muted-foreground/40 text-sm">Terminal Guide</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-14 space-y-14">

        {/* Hero */}
        <div className="space-y-4">
          <h1 className="font-serif font-bold text-5xl text-primary tracking-tight leading-tight">
            Playing on<br />the Terminal
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-prose">
            ClipChess is a Python CLI app — no browser, no account, no server.
            Two players share a game by pasting a compact string back and forth,
            over Slack, email, or anything that carries text.
          </p>
        </div>

        {/* Installation */}
        <section className="space-y-4">
          <SectionHeading>Installation</SectionHeading>
          <P>Python 3.10 or later required. Install the three dependencies:</P>
          <Terminal>pip install python-chess rich pyperclip</Terminal>
          <P>Clone the repo and navigate into the game folder:</P>
          <Terminal>{`git clone https://github.com/olivespecs/clipchess
cd clipchess`}</Terminal>
        </section>

        {/* Walkthrough */}
        <section className="space-y-0">
          <SectionHeading>Full Game Walkthrough</SectionHeading>

          <Step number={1} title="Alice starts a new game as White">
            <P>
              Run <Chip>--new</Chip> with your name and color. The game string is
              created and copied to your clipboard automatically.
            </P>
            <Terminal>python main.py --new --name Alice --color white</Terminal>
            <Terminal>{`✓ New game created!
  White: Alice
  Black: Opponent

Copied to clipboard — send this to Bob:
ClipChess_eJyrVkpUslIqS09...`}</Terminal>
            <P>Alice sends that string to Bob over Slack, text, or email.</P>
          </Step>

          <Step number={2} title="Alice makes the first move">
            <P>
              White always moves first. Alice runs <Chip>--play</Chip> with her
              own string and name. The board renders and she is prompted to move.
            </P>
            <Terminal>{`python main.py --play "ClipChess_eJyrVkpUslIqS09..." --name Alice`}</Terminal>
            <P>Alice enters her move in UCI format (source square + destination square):</P>
            <Terminal>{`► Your move (e.g. e2e4): e2e4

✓ Move encoded and copied to clipboard!
  Send this to Bob: ClipChess_xK92mNpQrVkp...`}</Terminal>
            <P>Alice copies the new string and sends it to Bob.</P>
          </Step>

          <Step number={3} title="Bob receives the string and replies">
            <P>
              Bob pastes Alice's string into <Chip>--play</Chip> with his own name.
              The board renders showing Alice's move highlighted, and Bob is prompted.
            </P>
            <Terminal>{`python main.py --play "ClipChess_xK92mNpQrVkp..." --name Bob`}</Terminal>
            <Terminal>{`► Your move (e.g. e7e5): e7e5

✓ Move encoded and copied to clipboard!
  Send this to Alice: ClipChess_mNp9Qr8sVk...`}</Terminal>
            <P>Bob sends that string back to Alice. The loop continues.</P>
          </Step>

          <Step number={4} last title="Repeat until the game ends">
            <P>
              Each player runs <Chip>--play</Chip> with the latest string they received,
              makes a move, then sends the new string back. Checkmate and stalemate are
              detected automatically — no extra steps needed.
            </P>
            <Terminal>{`python main.py --play "ClipChess_mNp9Qr8sVk..." --name Alice`}</Terminal>
          </Step>
        </section>

        {/* Special commands */}
        <section className="space-y-4">
          <SectionHeading>Special Commands</SectionHeading>
          <P>Type any of these instead of a move when prompted:</P>
          <div className="rounded-lg border border-border/40 overflow-hidden divide-y divide-border/30">
            {[
              { cmd: "resign",  desc: "Forfeit the game. Result is encoded into the string and sent to your opponent." },
              { cmd: "draw?",   desc: "Offer a draw. Your opponent sees the offer on their next turn." },
              { cmd: "draw!",   desc: "Accept a pending draw offer (only valid after your opponent has offered)." },
              { cmd: "history", desc: "Print the full move list in algebraic notation without making a move." },
              { cmd: "quit",    desc: "Exit immediately. Game state is unchanged and nothing is copied." },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-start gap-4 px-5 py-3.5 bg-card hover:bg-white/[0.03] transition-colors">
                <Chip>{cmd}</Chip>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Promotion */}
        <section className="space-y-4">
          <SectionHeading>Pawn Promotion</SectionHeading>
          <P>
            When a pawn reaches the back rank the game pauses and asks you to pick
            a promotion piece before applying the move:
          </P>
          <Terminal>Promote to? (q=queen, r=rook, b=bishop, n=knight): q</Terminal>
        </section>

        {/* Move format */}
        <section className="space-y-4">
          <SectionHeading>Move Format — UCI Notation</SectionHeading>
          <P>
            Every move is the source square followed by the destination square, no
            spaces. For promotions, append the piece letter.
          </P>
          <div className="rounded-lg border border-border/40 overflow-hidden divide-y divide-border/30">
            {[
              { move: "e2e4",  desc: "Pawn from e2 to e4  (King's Pawn opening)" },
              { move: "g1f3",  desc: "Knight from g1 to f3" },
              { move: "e1g1",  desc: "Kingside castling as White" },
              { move: "e7e8q", desc: "Pawn promotes to queen on e8" },
            ].map(({ move, desc }) => (
              <div key={move} className="flex items-center gap-4 px-5 py-3.5 bg-card hover:bg-white/[0.03] transition-colors">
                <Chip>{move}</Chip>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <P>En passant and castling are handled automatically — just enter the destination square.</P>
        </section>

        {/* View mode */}
        <section className="space-y-4">
          <SectionHeading>View Without Playing</SectionHeading>
          <P>
            Use <Chip>--view</Chip> to render any game string without being prompted for a move.
            Useful for checking the position or taking a screenshot.
          </P>
          <Terminal>{`python main.py --view "ClipChess_..."`}</Terminal>
        </section>

        {/* Quick ref */}
        <section className="space-y-4">
          <SectionHeading>Quick Reference</SectionHeading>
          <Terminal>{`# Start a new game
python main.py --new --name YourName --color white

# Receive opponent's string and make your move
python main.py --play "ClipChess_..." --name YourName

# View a position without playing
python main.py --view "ClipChess_..."`}</Terminal>
        </section>

        {/* CTA */}
        <div className="pt-4 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground/60 text-sm font-mono">
            Prefer the browser?
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="font-serif text-base h-11 px-8"
            data-testid="button-play-web"
          >
            Play in the Browser
          </Button>
        </div>

      </main>

      <footer className="border-t border-border/20 py-8 text-center">
        <a
          href="https://github.com/olivespecs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/40 hover:text-primary text-xs font-mono tracking-wider transition-colors"
          data-testid="link-github-footer"
        >
          github.com/olivespecs
        </a>
      </footer>
    </div>
  );
}
