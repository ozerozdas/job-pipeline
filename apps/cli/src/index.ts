import { Command } from "commander";
import { analyzeCommand } from "./commands/analyze.js";
import { summarizeCommand } from "./commands/summarize.js";
import { matchCommand } from "./commands/match.js";
import { askCommand } from "./commands/ask.js";
import { enrichCommand } from "./commands/enrich.js";

const program = new Command()
  .name("job-cli")
  .description("AI-powered job pipeline CLI using Anthropic Claude")
  .version("0.1.0");

program.addCommand(analyzeCommand);
program.addCommand(summarizeCommand);
program.addCommand(matchCommand);
program.addCommand(askCommand);
program.addCommand(enrichCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
