import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const INITIAL_STRING_EXAMPLE = "ClipChess_eNotjEEKgzAURK8S_tpipRZ...";

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
        <span className="text-sm font-bold text-primary font-mono">{number}</span>
      </div>
      <div className="space-y-2 pb-8 border-b border-border/30 flex-1">
        <h3 className="font-serif font-bold text-foreground text-lg">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code className="block bg-black/40 border border-border/50 rounded px-4 py-3 font-mono text-sm text-primary/90 whitespace-pre overflow-x-auto">
      {children}
    </code>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="bg-black/40 border border-border/30 rounded px-1.5 py-0.5 font-mono text-xs text-primary/90">
      {children}
    </code>
  );
}

export default function Docs() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-foreground gap-2"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="font-serif font-bold text-xl text-primary">ClipChess</span>
          <span className="text-muted-foreground/50 text-sm">/ Terminal Guide</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        <div className="space-y-4">
          <h1 className="font-serif font-bold text-4xl md:text-5xl text-primary tracking-tight">
            Playing on the Terminal
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            ClipChess ships as a Python CLI app — no browser required. Two players share a game by copy-pasting a compact string after each move, over Slack, text, email, or anything that carries text.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-serif font-bold text-2xl text-foreground">Installation</h2>
          <p className="text-muted-foreground text-sm">Python 3.10 or later is required.</p>
          <Code>{"pip install python-chess rich pyperclip"}</Code>
          <p className="text-muted-foreground text-sm">
            Then clone or download the <InlineCode>{"clipchess/"}</InlineCode> folder from the repository and navigate into it:
          </p>
          <Code>{"cd clipchess"}</Code>
        </section>

        <section className="space-y-8">
          <h2 className="font-serif font-bold text-2xl text-foreground">Full Game Walkthrough</h2>

          <div className="space-y-0">

            <Step number={1} title="Alice starts a new game as White">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Alice runs the <InlineCode>{"--new"}</InlineCode> flag with her name and chosen color.
                A fresh game state is created and the encoded string is copied to her clipboard automatically.
              </p>
              <Code>{"python main.py --new --name Alice --color white"}</Code>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Output:
              </p>
              <Code>{`✓ New game created!
  White: Alice
  Black: Opponent

String copied to clipboard. Send it to your opponent:
ClipChess_eJyrVkpUslIqS09...`}</Code>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Alice pastes that string to Bob over Slack, email, or any chat.
              </p>
            </Step>

            <Step number={2} title="Alice makes the first move (using her own string)">
              <p className="text-muted-foreground text-sm leading-relaxed">
                White always moves first. Alice runs <InlineCode>{"--play"}</InlineCode> with the string she just generated and her own name.
                The board renders, and since it is her turn she is prompted for a move.
              </p>
              <Code>{'python main.py --play "ClipChess_eJyrVkpUslIqS09..." --name Alice'}</Code>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The board appears in the terminal. Alice types her move in UCI format (from-square + to-square):
              </p>
              <Code>{"► Your move (e.g. e2e4, or 'resign' / 'draw?' / 'history' / 'quit'): e2e4\n✓ Move encoded and copied to clipboard!\n  Send this to Bob: ClipChess_xK92mNpQrVkp..."}</Code>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Alice copies the new string and sends it to Bob.
              </p>
            </Step>

            <Step number={3} title="Bob receives the string and plays his move">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Bob pastes the string Alice sent him into the <InlineCode>{"--play"}</InlineCode> flag, with his own name.
              </p>
              <Code>{'python main.py --play "ClipChess_xK92mNpQrVkp..." --name Bob'}</Code>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Bob sees the board with Alice's move highlighted and is prompted for his reply:
              </p>
              <Code>{"► Your move (e.g. e7e5, or 'resign' / 'draw?' / 'history' / 'quit'): e7e5\n✓ Move encoded and copied to clipboard!\n  Send this to Alice: ClipChess_mNp9Qr..."}</Code>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Bob sends that string back to Alice. The loop continues.
              </p>
            </Step>

            <Step number={4} title="Repeat until the game ends">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Each player runs <InlineCode>{"--play"}</InlineCode> with the latest string they received, makes a move, and sends the new string back.
                The game detects checkmate and stalemate automatically.
              </p>
              <Code>{"# Alice's turn again\npython main.py --play \"ClipChess_mNp9Qr...\" --name Alice"}</Code>
            </Step>

          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif font-bold text-2xl text-foreground">Special Commands</h2>
          <p className="text-muted-foreground text-sm">Type these instead of a move when prompted:</p>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            {[
              { cmd: "resign", desc: "Forfeit the game. The result is encoded into the string and sent to your opponent." },
              { cmd: "draw?", desc: "Offer a draw. Your opponent sees the offer on their next turn." },
              { cmd: "draw!", desc: "Accept a pending draw offer (only valid if your opponent has offered)." },
              { cmd: "history", desc: "Print the full move list in algebraic notation without making a move." },
              { cmd: "quit", desc: "Exit immediately. The game state is not changed and nothing is copied." },
            ].map(({ cmd, desc }, i) => (
              <div key={cmd} className={`flex gap-4 p-4 ${i % 2 === 0 ? "bg-card" : "bg-black/20"}`}>
                <InlineCode>{cmd}</InlineCode>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif font-bold text-2xl text-foreground">Pawn Promotion</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            When a pawn reaches the back rank, the game pauses and prompts you to choose a promotion piece before the move is applied:
          </p>
          <Code>{"Promote to? (q=queen, r=rook, b=bishop, n=knight): q"}</Code>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif font-bold text-2xl text-foreground">View a Board Without Playing</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Use <InlineCode>{"--view"}</InlineCode> to render any game string without being prompted for a move. Useful for checking the position or sharing a screenshot.
          </p>
          <Code>{'python main.py --view "ClipChess_..."'}</Code>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif font-bold text-2xl text-foreground">Move Format</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            All moves use <strong className="text-foreground">UCI notation</strong>: the source square followed by the destination square. No spaces.
          </p>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            {[
              { move: "e2e4", desc: "Pawn from e2 to e4 (King's pawn opening)" },
              { move: "g1f3", desc: "Knight from g1 to f3" },
              { move: "e1g1", desc: "Kingside castling (as White)" },
              { move: "e7e8q", desc: "Pawn promotes to queen on e8" },
            ].map(({ move, desc }, i) => (
              <div key={move} className={`flex gap-4 p-4 items-center ${i % 2 === 0 ? "bg-card" : "bg-black/20"}`}>
                <InlineCode>{move}</InlineCode>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            En passant and castling are handled automatically — just enter the king's destination square.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif font-bold text-2xl text-foreground">Quick Reference</h2>
          <Code>{`# Start a new game
python main.py --new --name YourName --color white

# Make a move (paste the string from your opponent)
python main.py --play "ClipChess_..." --name YourName

# View a position without playing
python main.py --view "ClipChess_..."`}</Code>
        </section>

        <div className="border-t border-border/30 pt-8 text-center">
          <Button onClick={() => setLocation("/")} className="font-serif text-base h-11 px-8" data-testid="button-play-web">
            Play in the Browser
          </Button>
        </div>

      </main>

      <footer className="border-t border-border/30 py-8 text-center text-muted-foreground/50 text-xs font-mono tracking-wider">
        <a
          href="https://github.com/olivespecs"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
          data-testid="link-github-footer"
        >
          github.com/olivespecs
        </a>
      </footer>
    </div>
  );
}
