// Every project on the site lives here: the poster on the home page and the
// whole case study page come from one entry.
//
// Inline marks, anywhere in the text:
//   ~~word~~  struck through      __word__  handwritten      ==word==  highlighter
//
// headline / caption: the confession at the top of the page / on the poster.
// tag + tags:         the little "who x what" line and the list of disciplines.
// intro:              the opening paragraphs, next to the tags.
// chapters:           the story, in order. Each has a mono `label`, plain-language
//                     prose in `body`, and optionally:
//                       nerd: '...'            a small "for the curious" line with
//                                              the technical names
//                       note: '...'            a handwritten aside in the margin
//                       gallery: ['key', ...]  screenshots from `shots`
//                       diagram: true          the hand-drawn system diagram
//                       fails: [{ t, b }]      the things that went wrong
// stack:              keys from src/work/stack.js, in the order they fall.
//
// The stories are written so someone outside tech can follow them. Anything
// personal (how it felt, what i learnt) is a draft: rewrite it wherever it
// isn't true.

export const PROJECTS = [
  /* ------------------------------------------------------------------ */
  {
    slug: 'getmyhelp',
    name: 'GetMyHelp',
    year: '2026',
    kicker: 'An app that tells you who’s at your gate, whether your cook is coming, and lets you say “let them in” from the sofa. Plus the website that explains it.',
    headline: 'who let the plumber in? ~~the register~~ __your phone__ knows.',
    caption: 'who let the plumber in? ~~ask the register~~ ask your phone.',
    tag: 'GetMyHelp X Priya',
    tags: ['mobile app', 'product design', 'live updates', 'website + 3d', 'launch'],
    role: 'started the app, built everything residents see, designed and built the website',
    team: 'with Priya Sharma',
    links: [
      { label: 'getmyhelp.in', href: 'https://getmyhelp.in' },
      { label: 'app code', href: 'https://github.com/shak5hi/getmyhelp' },
      { label: 'site code', href: 'https://github.com/shak5hi/getmyhelweb' },
    ],
    poster: { bg: '#2152e3', ink: '#ebe5d5', art: '/work/getmyhelp/site-rates.webp' },
    banner: '/work/getmyhelp/site-hero.webp',
    stack: ['reactnative', 'expo', 'typescript', 'firebase', 'fastapi', 'python', 'nextjs', 'react', 'tailwind', 'three', 'r3f', 'gsap', 'lenis', 'sentry', 'jest', 'actions', 'nginx', 'pm2', 'ubuntu'],
    shots: {
      hero: { src: '/work/getmyhelp/site-hero.webp', alt: 'The GetMyHelp home page: “Your maid shouldn’t be a monthly problem to solve” beside a small 3D housing society', caption: 'the whole society, small enough to hold' },
      rates: { src: '/work/getmyhelp/site-rates.webp', alt: 'A purple night scene of a 3D tower block with lit windows, captioned “One society-agreed rate card”', caption: 'then you fly up the towers…' },
      leave: { src: '/work/getmyhelp/site-leave.webp', alt: 'Inside a 3D flat, a helper figure in a doorway; text reads “People take leave. We plan for it, honestly.”', caption: '…and into a home. that’s where the problem lives.' },
    },
    intro: [
      '7:40 am. the doorbell of a flat on the ninth floor doesn’t ring, because the delivery guy is still downstairs, arguing with a guard who is flipping through a paper register, trying to call a number that’s switched off.',
      'every gated society in india runs like this. a notebook at the gate, a whatsapp group nobody reads, and a lot of “did didi come today?”',
      'GetMyHelp was our attempt to fix that morning. it was also the first thing i ever built that real people would ==rely on before their first cup of chai==.',
    ],
    chapters: [
      {
        label: 'the problem',
        body: [
          'a school project only has to work once, in front of a teacher who wants it to work. this had to work at 6am, on a cheap phone, on patchy internet, for a guard who ==never asked for an app== in the first place.',
          'and the two people on either side of the gate want completely different things. the resident wants to know. the guard wants to get on with his day. so i stopped thinking of it as one app.',
        ],
      },
      {
        label: 'two doors, one app',
        body: [
          'residents open a calm little dashboard: has my help arrived, who’s waiting at the gate, invite a guest, read the society notices, raise a complaint. in english or हिन्दी.',
          'guards get almost nothing, on purpose. snap a photo of the visitor. scan a guest’s pass. tap when they leave. ==big buttons, no thinking==. the best screen for a guard is the one with the fewest taps.',
          'i started the app and built everything residents see, from the first “enter your phone number” screen to settings. priya and i built the community, payments and notification pieces together.',
        ],
        note: 'the first screen even guesses which society you’re standing in.',
        nerd: 'react native + expo, expo router, typescript, phone otp through firebase, english / hindi throughout',
      },
      {
        label: 'the ding-dong',
        body: [
          'this is the heartbeat. a visitor walks up. the guard logs them. a split second later, ==a doorbell rings on the resident’s phone== with two buttons: let them in, or don’t. tap one, and the guard’s screen already knows.',
          'it feels like magic, but it’s really just a line that stays open between every phone and our server, so news travels the moment it happens instead of waiting for someone to refresh.',
        ],
        diagram: true,
        nerd: 'a fastapi backend with five live websocket channels (visitors, notifications, announcements, forum, posts); firebase phone tokens swapped for our own login tokens',
      },
      {
        label: 'the website',
        body: [
          'nobody reads a brochure about a housing society. so i built the website as a walk through one: as you scroll, a little 3d society flies past, up the towers and into a home, while the story of the problem plays out beside it.',
          'i also set up the server it lives on, because somebody had to learn how.',
        ],
        gallery: ['hero', 'rates', 'leave'],
        nerd: 'next.js 16, react three fiber, gsap + lenis for the scroll, emails over smtp, our own ubuntu server behind nginx + pm2',
      },
      {
        label: 'where it broke',
        fails: [
          { t: 'the shortcut disappeared.', b: 'there’s a handy tool that lets you see your changes on your phone instantly. the day we added phone-number login, it stopped working for us. every small change after that meant a slow rebuild, and i wasted days hoping it would fix itself.' },
          { t: '“works on my phone” isn’t a launch.', b: 'when we listed everything a real launch needs (crash reports, an offline warning, a way to force updates), the list was humbling. none of it shows up in a demo. all of it shows up in week one.' },
          { t: 'gps doesn’t climb stairs.', b: 'guessing your society from your location sounded clever. on the ninth floor of a concrete tower, it wasn’t. the “pick your society, tower and flat” screen became the main road, so it had to be just as nice.' },
        ],
      },
      {
        label: 'what i learnt',
        body: [
          'do the boring things on day one. an hour of setup early saves a week of panic later.',
          'and go stand at the gate. half of what made the guard app good came from realising ==the guard doesn’t want features. he wants fewer taps.==',
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'bento',
    name: 'Bento',
    year: '2026',
    kicker: 'A single health score for every software project you look after, with a tiny assistant that tells you what to fix first. Sold with a 3D lunchbox.',
    headline: 'every developer’s morning. ~~five tabs~~ __one lunchbox__.',
    caption: 'five tabs every morning. ~~five tabs~~ one lunchbox.',
    tag: 'Bento X Lavanya',
    tags: ['frontend', '3d modelling', 'animation', 'data plumbing', 'ai'],
    role: 'the 3d landing page, every 3d model, the animation, login and the dashboard, plus pulling in data from github, vercel and sentry',
    team: 'with Lavanya Verma',
    links: [{ label: 'code', href: 'https://github.com/shak5hi/bento' }],
    poster: { bg: '#ded3b8', ink: '#141414', art: '/work/bento/food.webp' },
    banner: '/work/bento/food.webp',
    stack: ['react', 'typescript', 'vite', 'three', 'r3f', 'blender', 'gsap', 'lenis', 'zustand', 'tailwind', 'router', 'node', 'express', 'supabase', 'claude', 'resend'],
    shots: {
      hero: { src: '/work/bento/landing.webp', alt: 'The Bento landing page: a closed black-and-red 3D bento box beside “Every project deserves a place at the table”', caption: 'lid on.' },
      food: { src: '/work/bento/food.webp', alt: 'A close-up of 3D bento food on red, with “See beyond the code”', caption: 'lid off. dive in.' },
      dashboard: { src: '/work/bento/dashboard.webp', alt: 'The end of the Bento landing: “Everything you build. One engineering home.” over a dashboard preview', caption: 'and out comes the product' },
      login: { src: '/work/bento/login.webp', alt: 'The Bento login page next to a 3D sushi and pickle model on orange', caption: 'even the login got a snack' },
    },
    intro: [
      'confession: i have never once opened my laptop and looked at only one thing.',
      'if you build software, your morning is a row of tabs. one says your code has a problem. one says your website failed to update. one says something crashed at 3am. and somewhere in between, ==a quiet feeling that something is on fire==.',
      'Bento turns that row of tabs into a single number out of 100 for each project, and a tiny assistant called Pickle tells you, in plain english, what to fix first.',
    ],
    chapters: [
      {
        label: 'the lunchbox',
        body: [
          'the name came first. and once you say “bento box”, the website more or less designs itself: the lid lifts, the trays slide apart, and ==every compartment holds one piece of the product==.',
          'which meant i had to finally learn 3d modelling properly. i built the box and every piece of food myself, then shrank the files until they’d load on a phone.',
        ],
        note: 'yes, there is a pickle. no further questions.',
        nerd: 'modelled in blender, exported as gltf, compressed with gltf-pipeline',
      },
      {
        label: 'one scroll, one story',
        body: [
          'on the website, how far you’ve scrolled is the only thing that matters. one number, from top to bottom, decides where the camera is and where every piece of food sits.',
          '“one number drives the whole scene.” ==that sentence took me two weeks.==',
        ],
        gallery: ['hero', 'food', 'dashboard'],
        nerd: 'react three fiber, a custom AnimationController, gsap timelines, lenis smooth scroll, shared scroll state in zustand',
      },
      {
        label: 'under the lid',
        body: [
          'behind the lunchbox, Bento quietly checks in on your tools every few hours and keeps a diary of what it finds. a set of rules grades five things: is it safe, is it tested, are its parts up to date, does it update cleanly, is it fast. Pickle reads the grades and writes the to-do list. and every monday, an email tells you what changed.',
          'my half was getting the information in from github, vercel and sentry. lavanya built the grading, Pickle and the reports.',
        ],
        diagram: true,
        nerd: 'node + express, scheduled jobs and github webhooks saving snapshots to supabase (postgres), a five-category scoring engine, claude haiku for insights, resend for the weekly email',
      },
      {
        label: 'the front door',
        body: ['the login page and dashboard got the same care, because the landing page is what people screenshot, but ==the dashboard is what they open every morning==.'],
        gallery: ['login'],
      },
      {
        label: 'where it broke',
        fails: [
          { t: 'the lunchbox was too heavy.', b: 'my first 3d files looked beautiful and weighed a tonne. a page that slow loses people before it even appears. “looks great on my laptop” and “loads on a phone on the metro” turned out to be two very different goals.' },
          { t: 'three clocks, one page.', b: 'the scrolling, the animation and the 3d scene each kept their own time. they disagreed by a fraction of a second and the box shivered. the fix was boring and perfect: one shared clock that everything listens to.' },
          { t: 'asking the ai every time would have cost a fortune.', b: 'the obvious design asks Pickle for advice every time you open the dashboard. multiply that by every project and every person and it’s a bill, not a feature. now Pickle thinks on a schedule and remembers its answers, so it costs almost nothing.' },
        ],
      },
      {
        label: 'what i learnt',
        body: [
          'decide how heavy something is allowed to be before you build it, not after.',
          'and show the boring screen to a real person early. ==the pretty one gets the likes. the boring one gets used.==',
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'byteforge',
    name: 'ByteForge',
    year: '2026',
    kicker: 'Teaching a computer to spot when three messy lists are talking about the same shop, 1.7 million times, for the ML Challenge 2026.',
    headline: '1.7 million shops. every one ~~unique~~ __near SBI ATM__.',
    caption: '1.7 million shops. every single one ~~unique~~ near SBI ATM.',
    tag: 'ByteForge X ML Challenge 2026',
    tags: ['machine learning', 'messy data', 'matching', 'measuring'],
    role: 'the matching pipeline, as one of a team of three',
    team: 'with Manaswita Shrivastav and Aadya Gupta',
    links: [{ label: 'code', href: 'https://github.com/shak5hi/ByteForge' }],
    poster: { bg: '#1638a8', ink: '#ebe5d5', type: 'Sharma Gen. Stores,\nnr SBI ATM\n= ?\nशर्मा जनरल स्टोर' },
    banner: null,
    bannerText: '“Sharma General Store, Near SBI ATM”  ·  “SHARMA GEN. STORES, opp. State Bank”  ·  “शर्मा जनरल स्टोर”  ·  ',
    stack: ['python', 'pandas', 'numpy', 'duckdb', 'rapidfuzz', 'xgboost', 'sklearn', 'docker'],
    shots: {},
    intro: [
      '“Sharma General Store, Near SBI ATM.”<br />“SHARMA GEN. STORES, opp. State Bank.”<br />“शर्मा जनरल स्टोर.”',
      'same shop? you knew in half a second. you didn’t even have to think.',
      'now imagine three enormous lists of businesses, written by three different people who never spoke to each other. no shared ids. names misspelt, shortened, written in different scripts. addresses that are just “behind the temple”. ByteForge is how we taught a computer to do ==your half-second, 1.7 million times==.',
    ],
    chapters: [
      {
        label: 'why this one',
        body: [
          'i wanted a problem where nothing could look finished before it was. no pretty screen to hide behind. either the matches were right, or they weren’t, and ==the leaderboard didn’t care how hard we tried==.',
          'and secretly, it’s a problem about people: about the hundred ways humans write the same thing.',
        ],
      },
      {
        label: 'how you teach it',
        body: [
          '<strong>tidy up.</strong> write everything the same way first. lowercase. “Road” becomes “rd”. hindi names spelt out in english letters.',
          '<strong>only compare neighbours.</strong> checking every shop against every other shop would take years. so we only compare shops that share something obvious, like the first word of their name. think of it as ==only knocking on doors on the same street==.',
          '<strong>look closely.</strong> for every likely pair, measure sixteen kinds of “how similar are these?”',
          '<strong>let it decide.</strong> a model, trained on examples we already knew, looks at those sixteen clues and says how sure it is. above a line, it’s a match.',
        ],
        diagram: true,
        note: 'the test set quietly included france. the model had never seen france. it coped.',
        nerd: 'unidecode + abbreviation rules, multi-key blocking (≤ 20 candidates per key) in duckdb, 16 rapidfuzz similarity features, an xgboost classifier, threshold tuned for macro f0.5',
      },
      {
        label: 'the numbers',
        body: [
          '1.7 million reference shops. 16 clues per pair. at most 20 neighbours checked per clue. a confidence line at 0.63. and after the challenge we kept going, and built a search that understands questions like “chemist near the station”, with its own test suite.',
        ],
        nerd: 'place-search layer: query parser, entity matcher, ranker behind a three-function api, 19 tests',
      },
      {
        label: 'where it broke',
        fails: [
          { t: 'we tried to compare everything with everything.', b: 'the “neighbours only” trick saved us, and taught us a hard rule: if two matching shops never end up on the same street, they can never be matched. that one step quietly decided how good everything after it could ever be.' },
          { t: 'the computer ran out of room. again.', b: 'our first full run tried to hold everything in memory at once and simply collapsed. we switched to a small database and worked through the list in chunks. the memory problem vanished, and our laptops filled up with tens of gigabytes of scratch files instead.' },
          { t: 'we were chasing the wrong score.', b: 'the challenge punished a wrong match much more than a missed one. our instinct was the opposite: find as many as possible. once we tuned for the score that actually counted, we jumped further than any clever new idea had taken us.' },
        ],
      },
      {
        label: 'what i learnt',
        body: [
          'read how you’re being judged before you start building. i now write the scoring first and the model second.',
          'and check each step on its own. when the final number drops, ==you want to know which step broke in a minute, not in three days==.',
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'footnote',
    name: 'Footnote',
    year: '2026',
    kicker: 'A home for long-form writing (essays, poems, stories) that you’re meant to sit with, with an AI helper and a soundtrack for every piece.',
    headline: 'a home for writing you’re meant to ~~skim~~ __feel__',
    caption: 'a writing app that plays like a ~~feed~~ record.',
    tag: 'Footnote X Aadya',
    tags: ['full-stack', '3d website', 'ai helper', 'payments'],
    role: 'the 3d record-player website, the writer’s dashboard, sign-up and login, the ai helper and its backup plan, the move to a new framework, and keeping the server standing',
    team: 'with Aadya Gupta',
    links: [{ label: 'code', href: 'https://github.com/shak5hi/footnote' }],
    poster: { bg: '#3a66ee', ink: '#ebe5d5', art: '/work/footnote/landing.webp' },
    banner: '/work/footnote/landing.webp',
    stack: ['nextjs', 'react', 'three', 'r3f', 'gsap', 'lenis', 'node', 'express', 'mongodb', 'mongoose', 'jwt', 'gemini', 'stripe', 'swagger'],
    shots: {
      hero: { src: '/work/footnote/landing.webp', alt: 'The Footnote landing page: “Architecture of Sound” beside a black vinyl record on blush pink', caption: 'the record waits for you' },
      frequency: { src: '/work/footnote/frequency.webp', alt: 'The record slides to the edge while a story card, “Coming Clean”, appears with a photo of a swimming tiger', caption: 'scroll, and stories play like tracks' },
      articles: { src: '/work/footnote/articles.webp', alt: 'A dark section of Footnote with four essay cards and photographs', caption: 'every essay gets its own mood' },
    },
    intro: [
      'there’s a kind of reading you do on a sunday afternoon, with a cup of something and a song on low. the internet is built for the opposite kind.',
      'Footnote was our small protest. a place for essays, poems and stories you’re meant to sit with. writers can add real footnotes, because some thoughts deserve a little aside. readers follow hand-picked reading trails instead of an endless feed.',
      'i write too. every writing site i tried felt like ==a content machine with a text box stuck to it==.',
    ],
    chapters: [
      {
        label: 'the record',
        body: [
          'one picture decided everything: reading should feel like putting on a record.',
          'so the website is a record player. as you scroll, the needle swings over, the record turns, and stories come up one after another ==like tracks on an album==.',
        ],
        gallery: ['hero', 'frequency'],
        nerd: 'a 3d vinyl and tonearm in react three fiber, driven by gsap scrolltrigger, smoothed with lenis',
      },
      {
        label: 'the writing desk',
        body: [
          'behind the record is a proper writing desk. drafts that save themselves. posts you can schedule. a history of every version, so you can undo last tuesday. reading stats, subscriptions, and a premium plan with real payments.',
          'and an ai helper: give it an idea and a mood, and it drafts a first version, then suggests a cover picture and a song to go with it.',
        ],
        diagram: true,
        gallery: ['articles'],
        nerd: 'next.js front end, an express 5 api on mongodb, jwt + bcrypt logins, stripe checkout and customer portal, gemini 2.5 flash for drafts, covers and music',
      },
      {
        label: 'where it broke',
        fails: [
          { t: 'the free ai said “not now”.', b: 'the free version of the ai only lets you ask so many times a minute, and it always runs out at the worst moment. so i built a backup: if the ai says no, a set of hand-written templates quietly steps in. writers always get something, and most never notice.' },
          { t: 'we moved house halfway through.', b: 'we started on one way of building websites and switched to another midway. right decision, painful week: links broke, settings went missing, and for a while two versions of the site existed at once.' },
          { t: 'one missing password and everything fell over.', b: 'if a single secret key was missing, the whole server refused to start, even the parts that didn’t need it. i rewired it so a missing key just switches that one feature off. now it starts with almost nothing.' },
        ],
      },
      {
        label: 'what i learnt',
        body: [
          'choose your foundations before you build the first room. moving later always costs more than you think, and the bill arrives exactly when you want to be polishing.',
          'and plan for things going wrong. the ai backup is one of my favourite things here, because it treats “the ai is down” as ==a normal tuesday, not an emergency==.',
        ],
        note: 'the hardest decision was how far apart the grooves on the record should be. i stand by it.',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'dsa-odyssey',
    name: 'DSA Odyssey',
    year: '2026',
    kicker: 'A game that gets students through 282 coding interview problems in the right order, and notices which ones they’ve been avoiding.',
    headline: 'day eleven is when everyone ~~quits~~ __levels up__',
    caption: 'the 400-problem sheet, but make it a ~~chore~~ quest.',
    tag: 'DSA Odyssey X me, myself',
    tags: ['product', 'game design', 'full-stack', 'smart practice'],
    role: 'all of it: the idea, the design, the website and the server',
    team: 'just me',
    links: [{ label: 'code', href: 'https://github.com/shak5hi/dsa_odyssey' }],
    poster: { bg: '#141414', ink: '#ebe5d5', art: '/work/dsa-odyssey/home.webp' },
    banner: '/work/dsa-odyssey/home.webp',
    stack: ['nextjs', 'react', 'typescript', 'node', 'express', 'sqlite', 'jwt'],
    shots: {
      home: { src: '/work/dsa-odyssey/home.webp', alt: 'The DSA Odyssey landing: a pixel-art forest with a cabin and a river, the title in gold, and a “Start Adventure” button', caption: '“the kingdom has fallen into chaos”' },
      login: { src: '/work/dsa-odyssey/login.webp', alt: 'The DSA Odyssey login: a glowing amber panel titled “Enter the Kingdom” on a dark grid', caption: 'you don’t log in. you enter.' },
    },
    intro: [
      '<em>day 1:</em> found a list of 400 coding problems every interviewer loves. starting today. ==this is my year.==<br /><em>day 4:</em> eleven done.<br /><em>day 11:</em> haven’t opened the tab.',
      'if you’ve studied computer science in india, you’ve written some version of that diary. months later you still freeze in interviews, not because you didn’t try, but because you tried in no particular order and never knew where you were weak.',
      'i was that student. DSA Odyssey is the thing i wish i’d had.',
    ],
    chapters: [
      {
        label: 'the problem',
        body: [
          'it was never effort. it was order, and feedback. a spreadsheet can’t notice that you keep marking the same kind of problem “too hard”. a spreadsheet doesn’t care that you skipped a week.',
          'i wanted something that noticed. and something genuinely fun, the way games get you to do things ==you’d never do for a to-do list==.',
        ],
      },
      {
        label: 'the kingdom',
        body: [
          '282 problems, sorted into 20 lands that unlock one after another, from the array archipelago to the dp citadel. you earn points, keep streaks, collect badges, and get a small ceremony every time you clear a land. pixel art, because practice should feel like an adventure.',
        ],
        gallery: ['home', 'login'],
        nerd: 'problems based on striver’s a2z sheet; next.js 16, react 19, typescript',
      },
      {
        label: 'the part that notices',
        body: [
          'after every problem, it asks one question: <em>how did that feel?</em> too easy, just right, or too hard.',
          'quietly, it keeps a “struggle score” for each land. if you keep finding one land hard, it becomes a ==focus zone==, and tomorrow’s practice slips in a couple of extra problems from it. you don’t do anything. it just notices, like a good teacher would.',
          'there’s also the codex: a notebook where you write what you learnt from each problem in your own words, so revision before interviews means reading yourself.',
        ],
        diagram: true,
        nerd: 'struggle score = (hard × 1 + medium × 0.4) ÷ rated; a focus zone above 0.35 with at least 2 ratings; express api with jwt login, sqlite database',
      },
      {
        label: 'where it broke',
        fails: [
          { t: 'one bad day isn’t a pattern.', b: 'the first version decided you were weak at something after a single “too hard”. one off day and your whole plan bent around it. now it waits for at least two ratings before it worries, like a friend who doesn’t panic over one text.' },
          { t: 'typing in 282 problems is the real final boss.', b: 'the points system took an evening. sorting, labelling and checking every single problem took far longer, and every mistake in that list showed up as a bug in the game.' },
          { t: 'built for one, not for a class.', b: 'i stored everything in a single small file, which is perfect while you’re building on your own laptop and a problem the moment a whole batch of students wants in. that’s the next chapter.' },
        ],
      },
      {
        label: 'what i learnt',
        body: ['give the smart part to five friends before polishing the celebrations. the animations are lovely, but ==the thing that actually helps is the feedback loop==, and it only gets smarter with real people using it.'],
        note: 'the dp citadel is supposed to feel unfair. working as intended.',
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'skillable',
    name: 'SkillAble',
    year: '2026',
    kicker: 'A job platform built first for people with disabilities, so applying, preparing and interviewing work for everyone, with AI help along the way.',
    headline: 'hiring, minus the ~~barriers~~ __obstacle course__',
    caption: 'a job hunt without the ~~barriers~~ obstacle course.',
    tag: 'SkillAble X the team',
    tags: ['full-stack', 'accessibility', 'live interviews', 'ai help'],
    role: 'full-stack, as part of the team',
    team: 'team project',
    links: [{ label: 'code', href: 'https://github.com/shak5hi/skillable' }],
    poster: { bg: '#b9ae96', ink: '#141414', art: '/work/skillable/home.webp' },
    banner: '/work/skillable/home.webp',
    stack: ['react', 'vite', 'tailwind', 'router', 'axios', 'zustand', 'framer', 'django', 'drf', 'channels', 'postgres', 'redis', 'fastapi', 'python', 'numpy', 'docker'],
    shots: {
      home: { src: '/work/skillable/home.webp', alt: 'The SkillAble home page: “Empowering Abilities Into Opportunities” next to a portrait, with skill-matching and mentor cards', caption: 'see the voice buttons? on every page.' },
      features: { src: '/work/skillable/features.webp', alt: 'Three SkillAble feature cards: Accessible Interview Rooms, AI Resume Analysis, Tailored Job Matching', caption: 'the three promises' },
      login: { src: '/work/skillable/login.webp', alt: 'The SkillAble login page with large fields and separate job seeker and employer sign-up buttons', caption: 'big targets, clear words' },
      signup: { src: '/work/skillable/signup.webp', alt: 'SkillAble sign-up: choose between “I’m looking for a job” and “I’m hiring”', caption: 'one question first' },
    },
    intro: [
      'try this: close your eyes and apply for a job. find the button. fill in the form. upload your resume. book the interview.',
      'that’s a normal tuesday for millions of people, on websites that were never built with them in mind. they get a line about “valuing diversity” at the bottom of the page.',
      'SkillAble started from the other end. ==what if a job site were built for people with disabilities first==, and everyone else just happened to benefit?',
    ],
    chapters: [
      {
        label: 'why this one',
        body: [
          'talent isn’t the barrier. the barriers are websites you can’t navigate, job posts that say nothing about the actual workplace, resumes nobody helps you write, and interviews that assume everyone communicates the same way.',
          'every one of those is a design problem. ==design problems are the ones i can’t leave alone.==',
        ],
      },
      {
        label: 'what we built',
        body: [
          'for job seekers: jobs with honest information about the workplace, a resume checker that suggests improvements, a place to track every application, and a site you can move around with your voice or just a keyboard.',
          'for employers: one place to post jobs, review people and run the hiring process.',
        ],
        gallery: ['home', 'features'],
        nerd: 'react + vite, react router, zustand, tailwind, framer motion',
      },
      {
        label: 'the plumbing',
        body: [
          'under the hood, one part keeps track of people, jobs and applications. another runs live interview rooms where everyone can talk in real time. and a separate ai helper reads resumes, and recognises sign language to help during interviews.',
        ],
        diagram: true,
        gallery: ['login', 'signup'],
        nerd: 'django rest framework on postgresql; django channels + redis (served by daphne) for live interview rooms; a separate fastapi service for resume analysis and sign-language recognition',
      },
      {
        label: 'where it broke',
        fails: [
          { t: 'we tried to build everything.', b: 'a job board, a resume checker, sign-language recognition, live interviews, voice controls, an employer dashboard. every one of those is a whole product. we built wide and fast, and paid for it in depth.' },
          { t: 'six machines to run one website.', b: 'every part we added made sense on its own. together, simply getting the whole thing running on a new laptop became a project, and a lot of “but it works on mine” lived in the gaps between them.' },
          { t: 'accessibility isn’t a settings page.', b: 'our first instinct was to add accessibility features. the real lesson: accessibility lives in everything. the order you move through a page, the contrast, the labels, the error messages. a toggle can’t fix a form a screen reader can’t read.' },
        ],
      },
      {
        label: 'what i learnt',
        body: [
          'pick one journey (say, a blind job seeker applying for one role, start to finish) and make it flawless before building anything else.',
          'and test it with the people it’s for. ==nothing we assumed survived meeting someone who actually relies on it.==',
        ],
        note: 'the most important feature is the one nobody screenshots: the order things get focused in.',
      },
    ],
  },
];

export const bySlug = (slug) => PROJECTS.find((p) => p.slug === slug);

// ~~word~~ struck through, __word__ handwritten, ==words== highlighter
export const marks = (s) =>
  s
    .replace(/~~(.+?)~~/g, '<s class="mk-strike">$1</s>')
    .replace(/__(.+?)__/g, '<span class="mk-script">$1</span>')
    .replace(/==(.+?)==/g, '<mark class="mk-hl">$1</mark>');
