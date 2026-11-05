(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const welcome = $("#welcomeScreen");
  const invite = $("#invitePaper");
  const topbar = $("#topbar");
  const experience = $("#experience");
  const controls = $("#journeyControls");
  const scenes = $$(".scene");
  const previousButton = $("#previousScene");
  const nextButton = $("#nextScene");
  const menu = $("#chapterMenu");
  const menuButton = $("#chapterMenuButton");
  const chapterList = $("#chapterList");
  const birthdayAudio = $("#birthdayMix");
  const makeWishButton = $("#makeWishButton");
  const cakeTrigger = $("#cakeIllustration");
  const soundStatus = $("#soundStatus");
  const soundButton = $("#soundButton");
  const soundLabel = $("#soundLabel");
  let activeScene = 0;
  let sceneUnlocked = false;
  let toastTimer = 0;
  let operationTimer = 0;
  let audioReady = false;
  let audioStarted = false;
  let audioPreparing = false;
  let wishInProgress = false;
  let wishReadyToBlow = false;
  let wishTimers = [];
  let touchStart = null;
  const boomLength = 1.15; // First 1.15s is the party boom; Jaane Kyun follows in the same file.
  const wishDuration = 5200; // Keep the candles lit long enough for a real wish.

  function showToast(message) {
    let toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
  }

  function setWishButton(label, icon = "✦", trailing = "↗") {
    const iconNode = $(".wish-button-icon", makeWishButton);
    const labelNode = $("#wishButtonText", makeWishButton);
    const trailingNode = $(".wish-button-arrow", makeWishButton);
    if (iconNode) iconNode.textContent = icon;
    if (labelNode) labelNode.textContent = label;
    if (trailingNode) trailingNode.textContent = trailing;
  }

  function setScene(index, direction = 1) {
    const next = Math.max(0, Math.min(scenes.length - 1, index));
    activeScene = next;
    scenes.forEach((scene, i) => {
      const active = i === next;
      scene.classList.toggle("is-active", active);
      scene.setAttribute("aria-hidden", String(!active));
      if ("inert" in scene) scene.inert = !active;
      if (active) scene.scrollTop = 0;
    });
    const total = scenes.length;
    const label = scenes[next].dataset.title || "A MEMORY";
    const count = `${String(next + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    $("#chapterCounter").textContent = count;
    $("#chapterName").textContent = label;
    $("#topProgressFill").style.width = `${((next + 1) / total) * 100}%`;
    $("#journeyCount").textContent = count;
    $("#journeyLabel").textContent = label;
    $("#journeyFill").style.width = `${((next + 1) / total) * 100}%`;
    previousButton.disabled = next === 0;
    nextButton.disabled = next === total - 1;
    nextButton.querySelector("small").textContent = next === total - 1 ? "THE LAST PAGE" : "KEEP GOING";
    [...chapterList.querySelectorAll("button")].forEach((button, i) => button.setAttribute("aria-current", String(i === next)));
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    if (next === total - 1) {
      $("#letterFinaleLine").hidden = !$("#letterPaper").hidden;
    }
  }

  function buildChapterMenu() {
    // The final letter is intentionally omitted from the jump menu. It is only
    // offered as the action inside the final scene.
    scenes.slice(0, -1).forEach((scene, index) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      const number = document.createElement("span");
      const title = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      title.textContent = scene.dataset.title || `CHAPTER ${index + 1}`;
      button.type = "button";
      button.append(number, title);
      button.addEventListener("click", () => setScene(index, index >= activeScene ? 1 : -1));
      li.append(button);
      chapterList.append(li);
    });
  }

  function unlockExperience() {
    if (sceneUnlocked) return;
    sceneUnlocked = true;
    welcome.classList.add("is-opening");
    document.body.classList.remove("intro-locked");
    window.setTimeout(() => {
      welcome.hidden = true;
      topbar.hidden = false;
      experience.hidden = false;
      controls.hidden = false;
      setScene(0);
    }, 560);
  }
  $("#openInvite").addEventListener("click", unlockExperience);
  $("#homeButton").addEventListener("click", () => setScene(0));
  previousButton.addEventListener("click", () => setScene(activeScene - 1, -1));
  nextButton.addEventListener("click", () => setScene(activeScene + 1, 1));
  menuButton.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
  });
  $("#closeChapterMenu").addEventListener("click", () => {
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
  });
  $$('[data-go]').forEach(button => button.addEventListener("click", () => setScene(Number(button.dataset.go))));
  buildChapterMenu();
  setScene(0);

  // One preloaded local audio file contains the boom followed immediately by
  // Jaane Kyun. Use the audio element's native src/preload path rather than
  // Fetch API + Blob: fetch is blocked for file:// pages by Chromium's origin rules.
  // The actual play() call still happens synchronously inside the cake tap.
  function updateSoundState() {
    const playing = !birthdayAudio.paused && !birthdayAudio.ended;
    soundButton.classList.toggle("is-playing", playing);
    soundButton.setAttribute("aria-pressed", String(playing));
    if (!audioStarted) soundLabel.textContent = audioReady ? "SOUND READY" : (audioPreparing ? "LOADING SOUND" : "SOUND RETRY");
    else if (playing && birthdayAudio.currentTime < boomLength) soundLabel.textContent = "PARTY BOOM";
    else if (playing) soundLabel.textContent = "JAANE KYUN";
    else soundLabel.textContent = "SOUND PAUSED";
    soundButton.querySelector(".sound-play").textContent = playing ? "Ⅱ" : "▶";
  }

  function setAudioReady() {
    if (audioReady) return;
    audioReady = true;
    audioPreparing = false;
    cakeTrigger.setAttribute("aria-disabled", "false");
    makeWishButton.disabled = false;
    setWishButton("MAKE A WISH — TAP WHEN READY", "✦", "↗");
    soundStatus.textContent = "SOUND READY. YOUR TAP WILL PLAY THE PARTY BOOM, THEN JAANE KYUN.";
    soundLabel.textContent = "SOUND READY";
    updateSoundState();
  }

  function setAudioFailure(message) {
    audioPreparing = false;
    audioReady = false;
    makeWishButton.disabled = false;
    setWishButton("RETRY SOUND LOAD", "↻", "↗");
    soundStatus.textContent = message || "THE SOUNDTRACK COULD NOT LOAD. CHECK assets/audio/birthday-surprise.mp3 AND RETRY.";
    soundLabel.textContent = "SOUND RETRY";
    updateSoundState();
  }

  function prepareAudio() {
    if (audioReady || audioPreparing) return;
    audioPreparing = true;
    makeWishButton.disabled = true;
    setWishButton("LOADING THE SURPRISE…", "✦", "↗");
    soundStatus.textContent = "LOADING THE COMPLETE SOUNDTRACK. THE WISH BUTTON WILL UNLOCK WHEN IT IS READY.";
    soundLabel.textContent = "LOADING SOUND";
    soundButton.disabled = true;

    birthdayAudio.preload = "auto";
    // The source is declared directly on <audio>. Do not call the Fetch API for it: fetch is
    // denied for file:// pages even though a native media element can load the
    // same local file. This keeps local previews and GitHub Pages consistent.
    birthdayAudio.load();
    checkAudioBuffer();
    if (birthdayAudio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) setAudioReady();
  }

  function checkAudioBuffer() {
    if (audioReady || birthdayAudio.error) return;
    try {
      if (birthdayAudio.duration > 0 && birthdayAudio.buffered.length) {
        const bufferedEnd = birthdayAudio.buffered.end(birthdayAudio.buffered.length - 1);
        if (bufferedEnd >= birthdayAudio.duration - 0.25) setAudioReady();
      }
    } catch (_) { /* Media metadata can be transient during loading. */ }
  }

  birthdayAudio.addEventListener("canplaythrough", setAudioReady);
  birthdayAudio.addEventListener("progress", checkAudioBuffer);
  birthdayAudio.addEventListener("loadedmetadata", checkAudioBuffer);
  birthdayAudio.addEventListener("loadeddata", checkAudioBuffer);
  birthdayAudio.addEventListener("error", () => {
    if (!audioReady) setAudioFailure("SOUND FILE NOT FOUND OR NOT SUPPORTED. CHECK assets/audio/birthday-surprise.mp3, THEN RETRY.");
  });
  birthdayAudio.addEventListener("play", updateSoundState);
  birthdayAudio.addEventListener("pause", updateSoundState);
  birthdayAudio.addEventListener("timeupdate", updateSoundState);
  birthdayAudio.addEventListener("ended", () => {
    // Loop only the music section; never repeat the party boom.
    birthdayAudio.currentTime = boomLength;
    birthdayAudio.play().catch(() => updateSoundState());
  });
  prepareAudio();

  function clearWishTimers() {
    wishTimers.forEach(timer => window.clearTimeout(timer));
    wishTimers = [];
  }

  function completeWish() {
    wishInProgress = false;
    wishReadyToBlow = false;
    const scene = $("#birthdayScene");
    scene.classList.remove("wish-in-progress");
    scene.classList.add("celebrated");
    cakeTrigger.setAttribute("aria-disabled", "true");
    setWishButton("WISH GRANTED · HAPPY 20TH!", "✦", "✓");
    makeWishButton.disabled = true;
    $("#wishCountdown").textContent = "WISH SENT. NOW GO MAKE IT HAPPEN. ✦";
    soundStatus.textContent = "THE CANDLES ARE OUT. JAANE KYUN IS PLAYING — LET THE CELEBRATION CONTINUE.";
    launchConfetti();
    wishTimers.push(window.setTimeout(launchConfetti, 520));
  }

  function enableBlowout() {
    if (!wishInProgress) return;
    wishReadyToBlow = true;
    makeWishButton.disabled = false;
    setWishButton("BLOW OUT THE CANDLES", "✦", "↗");
    $("#wishCountdown").textContent = "WHEN YOUR WISH IS READY, TAP TO BLOW OUT THE CANDLES.";
    soundStatus.textContent = "YOUR WISH IS STILL LIT. TAP THE BUTTON WHEN YOU ARE READY.";
  }

  function beginWishCountdown() {
    const countdown = $("#wishCountdown");
    const lines = [
      [0, "CLOSE YOUR EYES. TAKE A BREATH."],
      [1150, "MAKE YOUR WISH…"],
      [2300, "HOLD IT CLOSE. THINK BIG."],
      [3400, "ALMOST THERE…"],
      [4400, "TAKE YOUR TIME. YOUR CANDLES ARE STILL LIT."]
    ];
    lines.forEach(([delay, message]) => {
      wishTimers.push(window.setTimeout(() => {
        countdown.textContent = message;
      }, delay));
    });
    // Do not extinguish automatically when the boom ends or the short prompt timer expires.
    // The flames stay lit until the visitor explicitly presses the newly enabled blowout button.
    wishTimers.push(window.setTimeout(enableBlowout, wishDuration));
  }

  function resetWishAfterPlaybackFailure(error) {
    clearWishTimers();
    wishInProgress = false;
    wishReadyToBlow = false;
    audioStarted = false;
    const scene = $("#birthdayScene");
    scene.classList.remove("wish-in-progress", "celebrated");
    cakeTrigger.setAttribute("aria-disabled", "false");
    makeWishButton.disabled = false;
    setWishButton("RETRY THE BIRTHDAY SOUND", "↻", "↗");
    $("#wishCountdown").textContent = "YOUR WISH IS STILL WAITING. TAP AGAIN WHEN SOUND IS READY.";
    soundStatus.textContent = "THIS DEVICE BLOCKED AUDIO PLAYBACK. TAP THE WISH BUTTON AGAIN TO RETRY.";
    soundButton.disabled = true;
    updateSoundState();
    console.warn("Birthday audio playback was rejected:", error);
  }

  function handleWish() {
    // The first tap lights the candles and starts the audio. After the wish window,
    // a second explicit tap blows them out. The boom ending must never extinguish them.
    if (wishInProgress) {
      if (wishReadyToBlow) completeWish();
      return;
    }
    if (audioStarted) return;
    if (!audioReady) {
      soundStatus.textContent = "THE SOUND IS STILL LOADING. WAIT FOR SOUND READY, THEN MAKE YOUR WISH.";
      prepareAudio();
      return;
    }

    // Start playback directly within the user's click/tap gesture. There is no
    // await, fetch, timer, second player or source swap before play().
    birthdayAudio.pause();
    try { birthdayAudio.currentTime = 0; } catch (_) { /* The loaded track starts at zero by default. */ }
    birthdayAudio.volume = 0.92;
    let playback;
    try {
      playback = birthdayAudio.play();
    } catch (error) {
      resetWishAfterPlaybackFailure(error);
      return;
    }
    if (playback && typeof playback.catch === "function") playback.catch(resetWishAfterPlaybackFailure);

    audioStarted = true;
    wishInProgress = true;
    cakeTrigger.setAttribute("aria-disabled", "true");
    soundButton.disabled = false;
    const scene = $("#birthdayScene");
    scene.classList.remove("celebrated");
    scene.classList.add("wish-in-progress");
    makeWishButton.disabled = true;
    setWishButton("YOUR WISH IS IN THE MAKING…", "♡", "✦");
    soundStatus.textContent = "PARTY BOOM! JAANE KYUN WILL FOLLOW IN THE SAME TRACK.";
    $("#wishCountdown").textContent = "CLOSE YOUR EYES. TAKE A BREATH.";
    beginWishCountdown();
    updateSoundState();
  }

  makeWishButton.addEventListener("click", handleWish);
  cakeTrigger.addEventListener("click", handleWish);
  cakeTrigger.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleWish();
    }
  });

  soundButton.addEventListener("click", () => {
    if (!audioStarted || !audioReady) return;
    if (!birthdayAudio.paused) birthdayAudio.pause();
    else birthdayAudio.play().catch(() => showToast("Tap the sound control again to resume on this device."));
  });

  function launchConfetti() {
    const root = $("#partyBurst");
    const colors = ["#f6d28e", "#f39aa8", "#c9b1ec", "#ffb78f", "#fff0d9"];
    for (let i = 0; i < 78; i++) {
      const bit = document.createElement("i");
      bit.className = "confetti";
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = colors[i % colors.length];
      bit.style.setProperty("--dur", `${2.4 + Math.random() * 2.3}s`);
      bit.style.setProperty("--drift", `${(Math.random() - .5) * 230}px`);
      bit.style.setProperty("--spin", `${Math.random() * 920 - 460}deg`);
      bit.style.opacity = String(.65 + Math.random() * .35);
      root.append(bit);
      window.setTimeout(() => bit.remove(), 5200);
    }
  }

  // Operation replay: an animated sequence of mission log entries.
  const operationLog = $("#operationLog");
  const missionLines = [
    "23:59 — DECORATIONS COMPLETE. EVERYONE, STAY QUIET.",
    "00:00 — HAPPY BIRTHDAY, ROHAN!!!",
    "00:01 — ALERT: HOUSEMASTER DETECTED NEAR BLOCK 01.",
    "00:02 — FIFTEEN FRIENDS. FIFTEEN DIFFERENT ESCAPE PLANS.",
    "00:30 — SEARCH OVER. FRIENDSHIP INTACT. STEALTH: QUESTIONABLE."
  ];
  $("#replayOperation").addEventListener("click", () => {
    clearInterval(operationTimer);
    let line = 0;
    operationLog.textContent = missionLines[line];
    operationTimer = window.setInterval(() => {
      line++;
      operationLog.textContent = missionLines[Math.min(line, missionLines.length - 1)];
      if (line >= missionLines.length - 1) clearInterval(operationTimer);
    }, 1050);
  });

  // Holi: colour bursts and reveal the friendship line.
  $("#bringBackColour").addEventListener("click", () => {
    const holi = $("#holiScene");
    holi.classList.remove("colour-release");
    void holi.offsetWidth;
    holi.classList.add("colour-release");
    $("#holiLesson").hidden = false;
    window.setTimeout(() => holi.classList.remove("colour-release"), 1800);
  });

  // Shoes: reveal the case verdict with a stamp animation.
  $("#inspectEvidence").addEventListener("click", () => {
    $("#evidenceStamp").textContent = "CASE CLOSED";
    $("#evidenceStamp").classList.add("is-closed");
    $("#evidenceResult").hidden = false;
  });

  // Gallery: full-frame images, no crop; tap opens an uncropped lightbox.
  const photos = [
    { src:"assets/photos/the-crew.webp", alt:"The crew together outdoors", caption:"The squad. One frame, several stories." },
    { src:"assets/photos/pk-and-chou.webp", alt:"PK and Rahul standing together", caption:"PK & Chou. The original partnership." },
    { src:"assets/photos/pk-formal.webp", alt:"PK in a formal blue waistcoat and tie", caption:"A closer look. Same PK energy." },
    { src:"assets/photos/blue-kurta.webp", alt:"PK wearing a light blue kurta", caption:"Traditional mode. Same PK energy." },
    { src:"assets/photos/blue-suit.webp", alt:"PK wearing a blue formal suit", caption:"The Old Horse cleaned up nicely." },
    { src:"assets/photos/the-evidence.webp", alt:"A candid photograph from the old days", caption:"Exhibit A. No comments. Only evidence." },
    { src:"assets/photos/jnv-signboard.webp", alt:"Jawahar Navodaya Vidyalaya Korba signboard", caption:"The place that gave us more than a school ID." }
  ];
  let galleryIndex = 0;
  const galleryImage = $("#galleryImage");
  const galleryDots = $("#galleryProgress");
  photos.forEach((photo, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show photograph ${index + 1}`);
    dot.addEventListener("click", () => setGallery(index));
    galleryDots.append(dot);
  });
  function setGallery(index) {
    galleryIndex = (index + photos.length) % photos.length;
    const photo = photos[galleryIndex];
    galleryImage.style.opacity = "0";
    window.setTimeout(() => {
      galleryImage.src = photo.src;
      galleryImage.alt = photo.alt;
      galleryImage.style.opacity = "1";
      $("#galleryCaption").textContent = photo.caption;
    }, 130);
    $("#galleryFrameNumber").textContent = `FRAME ${String(galleryIndex + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`;
    [...galleryDots.children].forEach((dot, i) => dot.setAttribute("aria-current", String(i === galleryIndex)));
  }
  $("#galleryPrev").addEventListener("click", () => setGallery(galleryIndex - 1));
  $("#galleryNext").addEventListener("click", () => setGallery(galleryIndex + 1));
  setGallery(0);
  const galleryStage = $("#galleryStage");
  galleryStage.addEventListener("click", () => {
    const photo = photos[galleryIndex];
    $("#lightboxImage").src = photo.src;
    $("#lightboxImage").alt = photo.alt;
    $("#lightboxCaption").textContent = photo.caption;
    $("#photoLightbox").hidden = false;
    document.body.classList.add("lightbox-open");
    $("#closePhoto").focus();
  });
  function closeLightbox() {
    $("#photoLightbox").hidden = true;
    document.body.classList.remove("lightbox-open");
  }
  $("#closePhoto").addEventListener("click", closeLightbox);
  $("#photoLightbox").addEventListener("click", event => { if (event.target.id === "photoLightbox") closeLightbox(); });

  // Final letter can only be opened from the final scene.
  $("#openLetterButton").addEventListener("click", () => {
    $("#letterPaper").hidden = false;
    $("#letterFinaleLine").hidden = false;
    $("#letterIntro").hidden = true;
    const scene = $("#letterScene");
    window.setTimeout(() => scene.scrollTo({ top: 0, behavior: "smooth" }), 20);
  });

  // Keyboard and touch navigation.
  document.addEventListener("keydown", event => {
    if (!$("#photoLightbox").hidden && event.key === "Escape") { closeLightbox(); return; }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape" && !menu.hidden) { menu.hidden = true; menuButton.setAttribute("aria-expanded", "false"); return; }
    if (welcome.hidden === false) return;
    if (event.target.closest("button,a,input,textarea,select")) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); setScene(activeScene + 1, 1); }
    if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); setScene(activeScene - 1, -1); }
  });
  experience.addEventListener("touchstart", event => {
    if (event.touches.length !== 1) return;
    if (event.target.closest("button,a,.letter-paper,.photo-lightbox")) return;
    touchStart = { x:event.touches[0].clientX, y:event.touches[0].clientY, time:Date.now() };
  }, { passive:true });
  experience.addEventListener("touchend", event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 58 && Math.abs(dx) > Math.abs(dy) * 1.2 && Date.now() - touchStart.time < 900) {
      if (activeScene === 9) setGallery(galleryIndex + (dx < 0 ? 1 : -1));
      else if (dx < 0) setScene(activeScene + 1, 1);
      else setScene(activeScene - 1, -1);
    }
    touchStart = null;
  }, { passive:true });

  // Active story scenes retain their own natural scroll. The soundtrack is not
  // paused by page visibility; mobile operating systems may impose their own rules.
})();
