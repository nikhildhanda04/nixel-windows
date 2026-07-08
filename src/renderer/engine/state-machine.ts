import { NikxelState } from "../../shared/types";
import { stateAutoReturn } from "../../shared/constants";

type StateChangeCallback = (state: NikxelState) => void;
type FacingChangeCallback = (facingRight: boolean) => void;

export class StateMachine {
  private _state: NikxelState = NikxelState.idle;
  private _facingRight: boolean = true;
  private _positionX: number = 0;
  private _positionY: number = 0;

  private onStateChange: StateChangeCallback | null = null;
  private onFacingChange: FacingChangeCallback | null = null;

  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  get state(): NikxelState {
    return this._state;
  }

  set state(s: NikxelState) {
    if (this._state !== s) {
      this._state = s;
      if (this.onStateChange) this.onStateChange(s);
    }
  }

  get facingRight(): boolean {
    return this._facingRight;
  }

  set facingRight(f: boolean) {
    if (this._facingRight !== f) {
      this._facingRight = f;
      if (this.onFacingChange) this.onFacingChange(f);
    }
  }

  get positionX(): number {
    return this._positionX;
  }

  get positionY(): number {
    return this._positionY;
  }

  setPosition(x: number, y: number): void {
    this._positionX = x;
    this._positionY = y;
  }

  setStateChangeCallback(cb: StateChangeCallback): void {
    this.onStateChange = cb;
  }

  setFacingChangeCallback(cb: FacingChangeCallback): void {
    this.onFacingChange = cb;
  }

  setState(s: NikxelState): void {
    if (this._state === NikxelState.recording && s !== NikxelState.recording) return;
    if (this._state === NikxelState.writingMOM && s !== NikxelState.writingMOM) return;
    if (this._state === NikxelState.typing && s === NikxelState.thinking) return;
    this.state = s;
  }

  updateMouse(mouseX: number, windowCenterX: number): void {
    this.facingRight = mouseX > windowCenterX;
  }

  private clearTimer(name: string): void {
    const t = this.timers.get(name);
    if (t) {
      clearTimeout(t);
      this.timers.delete(name);
    }
  }

  triggerTyping(): void {
    if (this._state === NikxelState.recording) return;
    this.setState(NikxelState.typing);
    this.clearTimer("typing");
    this.timers.set(
      "typing",
      setTimeout(() => this.setState(NikxelState.idle), 200)
    );
  }

  triggerDone(): void {
    if (this._state === NikxelState.recording) return;
    this.setState(NikxelState.done);
    this.clearTimer("done");
    this.timers.set(
      "done",
      setTimeout(() => this.setState(NikxelState.idle), 1500)
    );
  }

  triggerPounce(): void {
    if (this._state === NikxelState.recording) return;
    this.setState(NikxelState.pounce);
    this.clearTimer("pounce");
    this.timers.set(
      "pounce",
      setTimeout(() => this.setState(NikxelState.idle), 700)
    );
  }

  triggerPetted(): void {
    if (this._state === NikxelState.recording) return;
    this.setState(NikxelState.petted);
    this.clearTimer("petted");
    this.timers.set(
      "petted",
      setTimeout(() => this.setState(NikxelState.idle), 2500)
    );
  }

  triggerAlert(): void {
    if (this._state === NikxelState.recording) return;
    this.setState(NikxelState.alert);
    this.clearTimer("alert");
    this.timers.set(
      "alert",
      setTimeout(() => this.setState(NikxelState.idle), 2000)
    );
  }

  startRecording(): void {
    this._state = NikxelState.recording;
    if (this.onStateChange) this.onStateChange(this._state);
  }

  stopRecording(): void {
    if (this._state === NikxelState.recording) {
      this.state = NikxelState.idle;
    }
  }

  startWritingMOM(): void {
    this._state = NikxelState.writingMOM;
    if (this.onStateChange) this.onStateChange(this._state);
  }

  endWritingMOM(): void {
    if (this._state === NikxelState.writingMOM) {
      this.state = NikxelState.idle;
    }
  }

  triggerMomReady(): void {
    this.setState(NikxelState.momReady);
    this.clearTimer("momReady");
    this.timers.set(
      "momReady",
      setTimeout(() => this.setState(NikxelState.idle), 2000)
    );
  }
}
