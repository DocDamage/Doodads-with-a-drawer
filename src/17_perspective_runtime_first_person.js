//==========================================================
// SECTION 7I: PERSPECTIVE (3D) RUNTIME: FIRST PERSON
//==========================================================
(function(P) {
    'use strict';

    // The editor borrows orbit view without changing the saved map setting or the running camera.
    const active = P.active;
    P.active = function() {
        const s = active.call(this);
        const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        return this.forDisplay(s, editing);
    };

    P.pointerCanvas = function() {
        return typeof Graphics !== 'undefined' && (Graphics._canvas || (Graphics.app && Graphics.app.view)) || null;
    };

    P.releaseMouseLook = function() {
        if (typeof document === 'undefined') return;
        const canvas = this.pointerCanvas();
        if (canvas && document.pointerLockElement === canvas && typeof document.exitPointerLock === 'function') document.exitPointerLock();
    };

    P.mouseLookAllowed = function() {
        const s = this.active();
        const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        const photo = Boolean(DocsDoodads.PhotoMode && DocsDoodads.PhotoMode.active);
        const scene = typeof SceneManager !== 'undefined' && SceneManager._scene;
        const mapScene = typeof Scene_Map === 'undefined' || scene instanceof Scene_Map;
        return Boolean(s && s.mode === 'first' && s.mouseLook && !editing && !photo && mapScene);
    };

    P.installMouseLook = function() {
        if (typeof document === 'undefined') return;
        const canvas = this.pointerCanvas();
        if (canvas && canvas !== this._firstMouseCanvas && typeof canvas.addEventListener === 'function') {
            if (this._firstMouseCanvas && typeof this._firstMouseCanvas.removeEventListener === 'function') {
                this._firstMouseCanvas.removeEventListener('click', this._firstMouseClick);
            }
            this._firstMouseCanvas = canvas;
            this._firstMouseClick = () => {
                const view = this.pointerCanvas();
                if (!view || !this.mouseLookAllowed() || document.pointerLockElement === view || typeof view.requestPointerLock !== 'function') return;
            // Pointer lock is requested only from this explicit player click.
                view.requestPointerLock();
            };
            canvas.addEventListener('click', this._firstMouseClick);
        }
        if (this._firstMouseInstalled || typeof document.addEventListener !== 'function') return;
        this._firstMouseInstalled = true;
        document.addEventListener('mousemove', event => {
            const view = this.pointerCanvas();
            if (!view || document.pointerLockElement !== view || !this.mouseLookAllowed()) return;
            const s = this.active();
            const yaw = ((s.yaw + (Number(event.movementX) || 0) * 0.15) % 360 + 360) % 360;
            const firstPitch = Math.max(-45, Math.min(60, s.firstPitch + (Number(event.movementY) || 0) * 0.12));
            $gameMap._docsCamera = Object.assign({}, $gameMap._docsCamera, { yaw, firstPitch });
            $gameMap._docsFirstPersonMode = true;
            this._activeMemo = null;
            if ($gamePlayer && $gamePlayer.setDirection) $gamePlayer.setDirection(this.directionForYaw(yaw));
        });
        document.addEventListener('keydown', event => {
            if (event && (event.key === 'Escape' || event.code === 'Escape')) this.releaseMouseLook();
        });
    };

    P.installMouseLook();

    if (typeof Game_Map !== 'undefined') {
        const setup = Game_Map.prototype.setup;
        Game_Map.prototype.setup = function(mapId) {
            P.releaseMouseLook();
            return setup.call(this, mapId);
        };

        const updateCamera = Game_Map.prototype.updateDocsCamera3d;
        Game_Map.prototype.updateDocsCamera3d = function(sceneActive) {
            P.installMouseLook();
            updateCamera.call(this, sceneActive);
            let s = P.active();
            const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
            if (s && s.mode === 'first' && !editing && !this._docsFirstPersonMode && typeof $gamePlayer !== 'undefined' && $gamePlayer) {
                const yaw = P.facingYaw($gamePlayer.direction());
                this._docsCamera = Object.assign({}, this._docsCamera, { yaw });
                this._docsFirstPersonMode = true;
                P._activeMemo = null;
                s = Object.assign({}, s, { yaw });
            }
            const photo = Boolean(DocsDoodads.PhotoMode && DocsDoodads.PhotoMode.active);
            if (!s || s.mode !== 'first' || !s.mouseLook || editing || photo || !sceneActive) P.releaseMouseLook();
        };
    }

    if (typeof Game_Player !== 'undefined') {
        const getInputDirection = Game_Player.prototype.getInputDirection;
        Game_Player.prototype.getInputDirection = function() {
            const s = P.active();
            if (!s || s.mode !== 'first' || typeof Input === 'undefined') return getInputDirection.call(this);
            const raw = Number(Input.dir4) || 0;
            const move = P.firstInput(raw, s.yaw);
            if (move.turn) {
                const triggered = typeof Input.isTriggered !== 'function'
                    || Input.isTriggered(move.turn < 0 ? 'left' : 'right');
                if (triggered && !$gameMap._docsCameraTween) {
                    const yaw = s.yaw + move.turn;
                    $gameMap.docsMoveCamera({ yaw }, 10);
                    $gameMap._docsFirstPersonMode = true;
                    this.setDirection(P.directionForYaw(yaw));
                }
                this._docsFirstBackstep = false;
                return 0;
            }
            this._docsFirstBackstep = move.backstep;
            return move.direction;
        };

        const executeMove = Game_Player.prototype.executeMove;
        Game_Player.prototype.executeMove = function(direction) {
            const backstep = this._docsFirstBackstep;
            const facing = this.direction();
            this._docsFirstBackstep = false;
            executeMove.call(this, direction);
            if (backstep) this.setDirection(facing);
        };
    }

    if (typeof Scene_Map !== 'undefined') {
        const terminate = Scene_Map.prototype.terminate;
        Scene_Map.prototype.terminate = function() {
            P.releaseMouseLook();
            return terminate.call(this);
        };
    }
})(DocsDoodads.Perspective);
