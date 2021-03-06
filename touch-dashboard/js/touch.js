define(["audio", "buttons", "constants", "lock", "stage", "util"],
  function(audio, buttons, C, lock, stage, util){
  'use strict';

  var _state,
      _elems;

  function init(state, elems, $window){
    _state = state;
    _elems = elems;

    $window.on("touchstart", touchstart)
           .on("touchmove", touchmove)
           .on("touchend", touchend);
  }

  function touchstart(e){
    for(var i =0; i < e.originalEvent.changedTouches.length; i++){
      var _touch = e.originalEvent.changedTouches[i];

      // Get hex coordinates for current touch
      var _hex_coordinates = stage.pixel_to_hex(_touch.clientX, _touch.clientY);
      var _button = buttons.get_button_by_hex(_hex_coordinates);
      if (_button !== undefined && !_button.touching) {
        _button.touchstart();
        _state.touch.touches.set(_touch.identifier, {
          touch: _touch,
          button: _button
        });
      } else if (_state.mode === C.ENUMS.MODE.LOCKED) {

        if (lock.state.state === C.ENUMS.LOCK_STATE.NONE){
          // Maximum 5
          if(_state.touch.touches.size >= 5)
            return;

          add_touch_with_overlay(_touch, "multi-2");

          if (_state.touch.touches.size === 5){
            lock.show_unlock_overlay_points();
          } else {
            audio.play("beep2");
          }
        }

        if(lock.state.state === C.ENUMS.LOCK_STATE.DIALOG) {
          // Start interacting with combination lock
          lock.lock_touch_started(_touch);
        }
      }
    }
    e.preventDefault();
  }

  function touchmove(e){
    for(var i =0; i < e.originalEvent.changedTouches.length; i++){
      var _touch = e.originalEvent.changedTouches[i];
      var _t = _state.touch.touches.get(_touch.identifier);
      if(_t === undefined)
        continue;
      _t.touch = _touch;
      if(_t.has_overlay){
        util.set_position_to_touch(_t.overlay, _touch);
        _t.overlay.css({
          top: _touch.clientY,
          left: _touch.clientX
        });
      }
      if(_t.is_lock_input){
        lock.lock_touch_moved(_touch);
      }
      if(_t.button !== undefined){
        // Check if still pressing button, and handle if not
        var _hex_coordinates = stage.pixel_to_hex(_touch.clientX, _touch.clientY);
        if(_t.button.q != _hex_coordinates.q || _t.button.r != _hex_coordinates.r){
          _t.button.touchend();
          delete _t.button;
        }
      }
      e.preventDefault();
    }
  }

  function touchend(e){
    for(var i =0; i < e.originalEvent.changedTouches.length; i++){
      var _touch = e.originalEvent.changedTouches[i];
      var _t = _state.touch.touches.get(_touch.identifier);
      if(_t === undefined)
        continue;
      if(_t.has_overlay){
        util.close_and_delete(_t.overlay);
      }
      if(_t.is_lock_input){
        lock.lock_touch_stopped();
      }
      if(_t.button !== undefined){
        _t.button.touchend();
        _t.button.callback();
      }
      _state.touch.touches.delete(_touch.identifier);
      _state.touch.last_touches.set(_touch.identifier, _touch);
    }
    // cleanup everything
    if(e.originalEvent.touches.length === 0){
      _state.touch.touches.clear();
      _elems.touch_overlays.children().each(function(){
        util.close_and_delete($(this));
      });
      _elems.lock_underlays.children().each(function(){
        util.close_and_delete($(this));
      });
    }
    // Perform actions on 0 active touches
    if(_state.touch.touches.size === 0){
      if(lock.state.state === C.ENUMS.LOCK_STATE.TOUCH_POINTS)
        lock.show_unlock_dialog();

    }
    e.preventDefault();
  }

  function add_touch_with_overlay(touch, template){
    var $touch_point = _elems.touch_overlay_templates[template].clone();
    $touch_point.appendTo(_elems.touch_overlays);
    util.set_position_to_touch($touch_point, touch);
    _state.touch.touches.set(touch.identifier, {
      touch: touch,
      has_overlay: true,
      overlay: $touch_point
    });
  }

  return {
    init: init
  }

});
