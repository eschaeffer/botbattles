# 🧯Student Troubleshooting & Common Mistakes
## When Your Bot Doesn’t Do What You Expected
Did something break?No worries, that’s normal.
This page is here to help you fix problems calmly and quickly, without guessing or panicking.
If your bot isn’t working, you’re probably one small fix away.
## 🧠 First: How to Use This Page
When something goes wrong:
- Read the error message (don’t skip it)
- Find the matching section below
- Fix one thing
- Reload bots and try again
Rule: Never change five things at once.That makes problems harder, not easier.
## 🚫 “My Bot Doesn’t Appear in the Game”
### Check these first
- Did you load the folder, not just a file?
- Does the folder contain both:
- myBotName.json
- behavior.js
- The .json file can have a custom name, identifying your bot, but…
- behavior.js should always have the same file name -- behavior.js
### Why this happens
The game only loads folders that look like valid bots.
If one file is missing or misnamed, the bot is skipped.

## ❌ “My Bot Failed to Load” (Red or Yellow Warning)
Look at the Bot Load Report.It will usually tell you what went wrong.
Here are the most common reasons.
## 🧾 Errors in bot.json
### ❌ Invalid JSON
Symptoms
- Error mentions “JSON” or “parse”
- Bot does not load at all
Common causes
- Missing comma
- Extra comma
- Missing { or }
Fix
- Check commas carefully
- Every { must have a }
- Every line except the last needs a comma
Tip: JSON is very strict. One missing comma can break everything.  Refer to the example files given, and make sure to follow the patterns you see there.

### ❌ Missing Required Fields
Symptoms
- Error mentions name, build, or required values
Fix
- Make sure bot.json includes:
- "name"
- "build" with all required tiers
- Compare your file to a working example
### ❌ Invalid wallBehavior
Symptoms
- Error mentions wallBehavior
Fix Use one of these only:
"wallBehavior": "stop"
"wallBehavior": "bounce"
"wallBehavior": "slide"
No capitals. No extra spaces.

## 🧠 Errors in behavior.js
### ❌ “tick is not defined” or similar
Cause
- Function name is wrong
- Missing function keyword
Fix Your file must include exactly this shape:
function tick(api) {
// your code
}
No extra functions. No renamed functions.
### ❌ JavaScript Syntax Error
Symptoms
- Error mentions “unexpected token”
- Bot crashes immediately
Common causes
- Missing }
- Missing )
- Misspelled keyword
Fix
- Check brackets carefully
- Line things up neatly
- Fix the first error shown
## 💥 “My Bot Crashed During the Match”
### What this means
Your bot loaded correctly, but something went wrong while it was running.
The game:
- Stops your bot safely
- Keeps other bots running
This is not punishment.
### Common causes
- Using a command that doesn’t exist (eg. api.move() instead of api.advance())
- Using a variable that doesn’t exist
- Calling an API function incorrectly
### Fix
- Check the API Cheatsheet
- Fix one line at a time
- Reload and try again
## 🧍 “My Bot Does Nothing”
### Check:
- Does it ever call advance()?
- Does it ever call turn()?
- Does it ever call fire()?
A bot with no actions is technically valid - but useless.
Fix Start with something simple:
api.advance(0.3);
Then add behavior slowly.
## 🔄 “My Bot Spins Forever”
### Likely cause
Turning too much every tick.
Example problem:
api.turn(30);
### Fix
Use smaller turns:
api.turn(4);
Small turns = more control.

## 🧱 “My Bot Freezes at Walls”
### This is expected behavior (sometimes)
If your bot uses:
"wallBehavior": "stop"
Then:
- It will pause briefly at walls
- This can look like freezing
### Fix options
- Turn more often
- Change wall behavior later
- Don’t panic - this is a design choice
- Upgrade your bot - there are other choices than “stop”, they cost configuration points, though :)
- "wallBehavior": "bounce"
- "wallBehavior": "slide"
## 🔫 “My Bot’s Laser Never Hits Anything”
### Common causes
- Firing without aiming
- Never checking alignment
- Turning too fast
### Fix pattern
let target = api.scan();
if (api.aligned(target)) {
api.fire();
}
Aim first. Then shoot.

## 🧠 “I Changed Something and Now Everything’s Broken”
This happens to everyone.
### Bummer…
- As you reach certain milestones, save your bot folder with a new name, as a backup.
- Eg. MoverBot-v3
- In your file editor, try to “undo”, generally “Ctrl-Z”
### Best recovery move
- Undo your last change
- Reload bots with old working code
- Confirm it works
- Try again - smaller changes this time
## 📁 Learn From Broken Examples
Your teacher may provide example folders like:
sampleBots/failedBotExamples/
These show:
- Real mistakes
- What errors look like
- How small issues cause big problems
Broken bots are learning tools - not failures.

## 🧪 Final Debugging Rules
- Read the error
- Fix one thing
- Reload
- Test
- Repeat
If you can explain:
“Why did my bot do that?”
…then you are learning exactly what BotBattles is meant to teach.
## 🆘 When to Ask for Help
Ask for help after you can say:
- What you changed
- What error you saw
- What you tried
That makes help fast and useful.
