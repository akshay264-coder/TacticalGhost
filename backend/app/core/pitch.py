"""
Pitch coordinate system, geometry constants, and spatiotemporal kinematics.
Standard pitch coordinates:
- X: 0.0 to 105.0 meters (0 = Home goal line, 105 = Away goal line)
- Y: 0.0 to 68.0 meters (0 = Touchline bottom, 68 = Touchline top)
- Center spot: (52.5, 34.0)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
from scipy.signal import savgol_filter


@dataclass(frozen=True)
class PitchDimensions:
    length: float = 105.0
    width: float = 68.0
    penalty_box_length: float = 16.5
    penalty_box_width: float = 40.32
    goal_box_length: float = 5.5
    goal_box_width: float = 18.32
    center_circle_radius: float = 9.15
    penalty_spot_distance: float = 11.0
    goal_width: float = 7.32


PITCH_DIMS = PitchDimensions()


def metrica_to_metric(
    x_norm: Union[float, np.ndarray],
    y_norm: Union[float, np.ndarray],
    field_length: float = PITCH_DIMS.length,
    field_width: float = PITCH_DIMS.width,
    invert_y: bool = True
) -> Tuple[Union[float, np.ndarray], Union[float, np.ndarray]]:
    """
    Converts Metrica normalized tracking coordinates [0, 1] to metric pitch meters [0, 105] x [0, 68].
    In Metrica Sports tracking:
    - (0, 0) is top-left
    - (1, 1) is bottom-right
    When invert_y is True:
    - Y is flipped so 0 is bottom touchline and field_width is top touchline.
    """
    x_m = x_norm * field_length
    if invert_y:
        y_m = (1.0 - y_norm) * field_width
    else:
        y_m = y_norm * field_width
    return x_m, y_m


def metric_to_centered(
    x_m: Union[float, np.ndarray],
    y_m: Union[float, np.ndarray],
    field_length: float = PITCH_DIMS.length,
    field_width: float = PITCH_DIMS.width
) -> Tuple[Union[float, np.ndarray], Union[float, np.ndarray]]:
    """
    Converts metric coordinates [0, 105] x [0, 68] to pitch-centered [-52.5, 52.5] x [-34.0, 34.0].
    """
    return x_m - (field_length / 2.0), y_m - (field_width / 2.0)


def centered_to_metric(
    x_c: Union[float, np.ndarray],
    y_c: Union[float, np.ndarray],
    field_length: float = PITCH_DIMS.length,
    field_width: float = PITCH_DIMS.width
) -> Tuple[Union[float, np.ndarray], Union[float, np.ndarray]]:
    """
    Converts pitch-centered coordinates [-52.5, 52.5] x [-34.0, 34.0] to metric [0, 105] x [0, 68].
    """
    return x_c + (field_length / 2.0), y_c + (field_width / 2.0)


def compute_velocity(
    x: np.ndarray,
    y: np.ndarray,
    fps: float = 25.0,
    smooth_window: int = 7,
    poly_order: int = 2,
    max_speed: float = 12.0
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Computes smoothed velocity vectors (vx, vy) and scalar speed from 2D coordinates.
    Uses Savitzky-Golay polynomial derivative filtering to eliminate frame-rate jitter.
    
    Parameters:
    - x, y: 1D arrays of player/ball positions in meters
    - fps: Frame rate in Hz (default 25.0 fps for Metrica)
    - smooth_window: Window length for Savitzky-Golay filter (must be odd and > poly_order)
    - poly_order: Polynomial order
    - max_speed: Physical cap in m/s (12.0 m/s ~ 43.2 km/h, covering elite sprinting)
    
    Returns:
    - vx: velocity along X axis in m/s
    - vy: velocity along Y axis in m/s
    - speed: scalar Euclidean speed in m/s
    """
    n = len(x)
    if n < smooth_window:
        # Fallback to simple finite difference for very short sequences
        dt = 1.0 / fps
        vx = np.gradient(x, dt)
        vy = np.gradient(y, dt)
    else:
        # Ensure window is odd
        w = smooth_window if smooth_window % 2 == 1 else smooth_window + 1
        w = min(w, n if n % 2 == 1 else n - 1)
        dt = 1.0 / fps
        # Savitzky-Golay first derivative
        vx = savgol_filter(x, window_length=w, polyorder=poly_order, deriv=1, delta=dt)
        vy = savgol_filter(y, window_length=w, polyorder=poly_order, deriv=1, delta=dt)

    speed = np.sqrt(vx**2 + vy**2)
    # Physical plausibility clamp
    speed_clipped = np.clip(speed, 0.0, max_speed)
    scale = np.where(speed > max_speed, max_speed / np.maximum(speed, 1e-6), 1.0)
    vx = vx * scale
    vy = vy * scale

    return vx, vy, speed_clipped


def compute_kinematics(
    x: np.ndarray,
    y: np.ndarray,
    fps: float = 25.0,
    smooth_window: int = 7,
    poly_order: int = 2,
    max_speed: float = 12.0,
    max_accel: float = 8.0
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Computes smoothed velocities (vx, vy, speed) AND accelerations (ax, ay, accel).
    
    Parameters:
    - x, y: 1D arrays of player/ball positions in meters
    - fps: Frame rate in Hz (default 25.0 fps)
    - smooth_window: Window length for Savitzky-Golay filter
    - poly_order: Polynomial order
    - max_speed: Physical velocity cap in m/s (12.0 m/s ~ 43.2 km/h)
    - max_accel: Physical acceleration cap in m/s^2 (8.0 m/s^2 covers elite sprint acceleration)
    
    Returns:
    - vx: velocity along X axis in m/s
    - vy: velocity along Y axis in m/s
    - speed: scalar Euclidean speed in m/s
    - ax: acceleration along X axis in m/s^2
    - ay: acceleration along Y axis in m/s^2
    - accel: scalar tangential acceleration (d(speed)/dt) in m/s^2
      accel > 1.5: High acceleration
      accel < -1.5: High deceleration / braking
    """
    vx, vy, speed = compute_velocity(
        x, y, fps=fps, smooth_window=smooth_window, poly_order=poly_order, max_speed=max_speed
    )
    
    n = len(speed)
    dt = 1.0 / fps
    if n < smooth_window:
        ax = np.gradient(vx, dt)
        ay = np.gradient(vy, dt)
        accel = np.gradient(speed, dt)
    else:
        w = smooth_window if smooth_window % 2 == 1 else smooth_window + 1
        w = min(w, n if n % 2 == 1 else n - 1)
        ax = savgol_filter(vx, window_length=w, polyorder=poly_order, deriv=1, delta=dt)
        ay = savgol_filter(vy, window_length=w, polyorder=poly_order, deriv=1, delta=dt)
        accel = savgol_filter(speed, window_length=w, polyorder=poly_order, deriv=1, delta=dt)

    ax = np.clip(ax, -max_accel, max_accel)
    ay = np.clip(ay, -max_accel, max_accel)
    accel = np.clip(accel, -max_accel, max_accel)

    return vx, vy, speed, ax, ay, accel


def get_tactical_zones() -> Dict[str, Dict[str, float]]:
    """
    Returns standard tactical zones coordinates on [0, 105] x [0, 68] pitch.
    Including:
    - Zone 14 (Attacking central zone right outside defensive 18-yard box)
    - Left & Right Half-spaces
    - Central corridor
    - Defensive & Attacking 18-yard boxes
    """
    return {
        "zone_14_attacking_right": {
            "x_min": 70.0,
            "x_max": 88.5,
            "y_min": 20.4,
            "y_max": 47.6,
            "description": "Zone 14 (central space directly in front of the opponent's penalty box)"
        },
        "zone_14_attacking_left": {
            "x_min": 16.5,
            "x_max": 35.0,
            "y_min": 20.4,
            "y_max": 47.6,
            "description": "Zone 14 (central space in front of defending home penalty box)"
        },
        "right_half_space_attacking": {
            "x_min": 52.5,
            "x_max": 88.5,
            "y_min": 13.6,
            "y_max": 27.2,
            "description": "Right attacking half-space"
        },
        "left_half_space_attacking": {
            "x_min": 52.5,
            "x_max": 88.5,
            "y_min": 40.8,
            "y_max": 54.4,
            "description": "Left attacking half-space"
        },
        "penalty_area_away": {
            "x_min": 88.5,
            "x_max": 105.0,
            "y_min": 13.84,
            "y_max": 54.16,
            "description": "Away penalty box (attacking right)"
        },
        "penalty_area_home": {
            "x_min": 0.0,
            "x_max": 16.5,
            "y_min": 13.84,
            "y_max": 54.16,
            "description": "Home penalty box (attacking left)"
        }
    }
