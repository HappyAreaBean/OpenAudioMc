import {Hark} from "../../helpers/libs/hark.bundle";
import GainController from "mediastream-gain";
import {oalog} from "../../helpers/log";

export class MicrophoneProcessor {

    constructor(openAudioMc, voiceModule, stream) {
        this.openAudioMc = openAudioMc
        this.stream = stream;
        this.voiceModule = voiceModule;
        this.id = "visual-speaking-indicator";
        this.startedTalking = null;
        this.shortTriggers = 0;

        this.harkEvents = Hark(this.stream, {})

        this.enabledAutoAdjustments = (Cookies.get("mic-sensitivity-bot") === "enabled")

        document.getElementById("enable-auto-adjustments").checked = this.enabledAutoAdjustments;

        document.getElementById("enable-auto-adjustments").onchange = (e) => {
            if (e.target.checked) {
                this.enabledAutoAdjustments = true;
                Cookies.set("enable-auto-adjustments", "enabled", {expires: 30});
            } else {
                this.enabledAutoAdjustments = false;
                Cookies.set("enable-auto-adjustments", "disabled", {expires: 30});
            }
        }

        this.gainController = new GainController(stream);

        let presetVolume = Cookies.get("mic-sensitivity");
        if (presetVolume != null) {
            presetVolume = parseInt(presetVolume)
            this.harkEvents.setThreshold(presetVolume)
        }

        document.getElementById("mic-sensitive-slider").value = Math.abs(this.harkEvents.getThreshold())
        this.currentThreshold = this.harkEvents.getThreshold();

        this.isSpeaking = false;
        this.harkEvents.setInterval(5)

        document.getElementById("mic-sensitive-slider").oninput = (e) => {
            this.updateSensitivity(e.target.value)
        }

        this.harkEvents.on('speaking', () => {
            this.isSpeaking = true;
            this.startedTalking = new Date().getTime();

            // set talking UI
            document.getElementById(this.id).style.backgroundColor = "#34D399"
            document.getElementById(this.id).style.color = "#EC4899"
            this.gainController.on();
        });

        this.harkEvents.on('volume_change', measurement => {
            // only process data when the user is actively speaking
            let level = Math.abs(measurement)
        })

        this.harkEvents.on('stopped_speaking', () => {
            this.isSpeaking = false;

            // set talking UI
            document.getElementById(this.id).style.backgroundColor = ""
            document.getElementById(this.id).style.color = ""
            this.gainController.off();

            // how long did I talk for?
            let timeActive = new Date().getTime() - this.startedTalking;
            let secondsTalked = (timeActive / 1000);
            if (secondsTalked < 1.5) {
                this.shortTriggers++;
                if (this.shortTriggers > 25) {
                    this.decreaseSensitivity();
                    this.shortTriggers = 0;
                }
            } else {
                this.shortTriggers = 0;
            }
        });

        this.longSessions = 0;

        // automatically check through a task how long the current speech is
        setInterval(() => {
            if (!this.isSpeaking) return;
            let timeActive = new Date().getTime() - this.startedTalking;
            let secondsTalked = (timeActive / 1000);

            if (secondsTalked > 10) {
                this.longSessions++;
                this.startedTalking = new Date().getTime();
            }

            if (this.longSessions > 1) {
                this.decreaseSensitivity()
                this.longSessions = 0;
                this.startedTalking = new Date().getTime();
            }

        }, 500);
    }

    updateSensitivity(toPositive) {
        let target = -Math.abs(toPositive)
        this.harkEvents.setThreshold(target)
        Cookies.set("mic-sensitivity", target + "", {expires: 30});
        this.currentThreshold = this.harkEvents.getThreshold();
    }

    decreaseSensitivity() {
        if (!this.enabledAutoAdjustments) return;
        let current = Math.abs(this.currentThreshold);
        current -= 5;
        this.updateSensitivity(current)
        document.getElementById("mic-sensitive-slider").value = current;
    }

    stop() {
        this.harkEvents.stop()
    }

}
