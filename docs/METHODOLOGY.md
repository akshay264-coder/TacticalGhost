# TacticalGhost — Research Methodology & Analytical Foundations

**Tagline:** *See the game beyond the ball.*  
**Domain:** Football Analytics, Spatiotemporal Tracking Intelligence, Explainable Tactical Decisions.

---

## 1. Core Mathematical & Spatiotemporal Formulations

TacticalGhost evaluates football tracking data using spatiotemporal potential fields, kinematic derivatives, convex geometry, and expected threat surfaces.

### 1.1 Pitch Control Intelligence (Spearman Model)
Based on William Spearman (2018), *"Beyond Expected Goals: Accounting for Player Movement with Physics-Based Pitch Control"*, MIT Sloan Sports Analytics Conference.

- **Time-to-Intercept (TTI)**:
  For any player $j$ at coordinate $\vec{p}_j = (x_j, y_j)$ with instantaneous velocity vector $\vec{v}_j = (v_{x, j}, v_{y, j})$:
  $$\vec{r}_j = \vec{p}_j + \vec{v}_j \cdot T_{\text{react}}$$
  $$d_j(\vec{x}) = \|\vec{x} - \vec{r}_j\|_2$$
  $$\text{TTI}_j(\vec{x}) = T_{\text{react}} + \frac{d_j(\vec{x})}{v_{\max}}$$
  *Parameters:* Reaction delay $T_{\text{react}} = 0.50\,\text{s}$, maximum sprint velocity $v_{\max} = 7.5\,\text{m/s}$.

- **Team Control Probability Field**:
  For meshgrid coordinates $\vec{x} \in [0, 105] \times [0, 68]$:
  $$P_{\text{Home}}(\vec{x}) = \frac{1}{1 + \exp\left( -\frac{\min_{k \in \text{Away}} \text{TTI}_k(\vec{x}) - \min_{i \in \text{Home}} \text{TTI}_i(\vec{x})}{\sigma_t} \right)}$$
  $$P_{\text{Away}}(\vec{x}) = 1.0 - P_{\text{Home}}(\vec{x})$$
  *Assumption:* $\sigma_t = 0.45\,\text{s}$ captures human sprint variability and arrival time variance.

---

### 1.2 Module 1: Space Creation Intelligence

1. **Off-Ball Run Identification**:
   - Condition 1: $\|\vec{p}_i(t) - \vec{p}_{\text{ball}}(t)\| > 3.5\,\text{m}$ (player is not in possession).
   - Condition 2: Sustained movement speed $s_i(t) \ge 3.5\,\text{m/s}$ or acceleration $a_i(t) \ge 1.5\,\text{m/s}^2$ over $\ge 0.4\,\text{s}$ (10 frames at 25 fps).
   - Trajectory displacement: Net distance covered $\|\vec{p}_i(t_{\text{end}}) - \vec{p}_i(t_{\text{start}})\| \ge 4.0\,\text{m}$.

2. **Decoy Run Index**:
   A run that opens space for teammates by pulling an opponent marker away from critical zones:
   $$\text{DecoyScore} = \min\Big(1.0,\; 0.40 \cdot \text{MarkerTrackingIndex} + 0.35 \cdot \Delta PC_{\text{vacated}} + 0.25 \cdot \text{ZoneWeight}\Big)$$
   - **Marker Tracking Index**: Cosine directional alignment $\frac{\Delta \vec{p}_{\text{runner}} \cdot \Delta \vec{p}_{\text{def}}}{\|\Delta \vec{p}_{\text{runner}}\| \|\Delta \vec{p}_{\text{def}}\|}$ scaled by initial marking proximity.
   - **$\Delta PC_{\text{vacated}}$**: Increase in teammate pitch control in a $5.0\,\text{m}$ radius surrounding the runner's initial vacated origin.
   - **Strategic Zone Weight**: Higher multiplier for spaces impacting Zone 14 ($[70, 88.5] \times [20.4, 47.6]$), the half-spaces, and the 18-yard box.

---

### 1.3 Module 2: Defensive Vulnerability Detection

*Strict Rule 8 Adherence: Gaps are only dangerous if accessible under current ball context and defensive cover.*

1. **Compactness & Stretch Index** (Bourbousson et al., 2010):
   $$\vec{p}_{\text{centroid}} = \frac{1}{N_{\text{def}}} \sum_{k=1}^{N_{\text{def}}} \vec{p}_k$$
   $$\text{StretchIndex} = \frac{1}{N_{\text{def}}} \sum_{k=1}^{N_{\text{def}}} \|\vec{p}_k - \vec{p}_{\text{centroid}}\|_2$$
   Convex hull area computed via Shapely geometry across outfield defending players.

2. **Broken Offside Line**:
   $$\text{LineHeight} = \text{median}\big(x_{\text{backline}}\big)$$
   $$\text{Broken} = \exists\, k \in \text{backline} : |x_k - \text{LineHeight}| \ge 2.5\,\text{m}$$

3. **Contextual Danger Score**:
   $$V_{\text{danger}} = \text{BaseZoneDanger} \times \text{CarrierFreedom} \times \text{PassAccessibility} \times \big(1 - 0.70 \cdot \text{DefCover}\big) \times (1 + 0.30 \cdot \text{GapPenalty})$$
   - **Carrier Freedom**: $1.0 - \text{PressureOnCarrier}$ (if carrier is under immediate tackle pressure, they cannot exploit the gap).
   - **Pass Accessibility**: Distance and line of sight from ball carrier to target space.
   - **Defensive Cover**: Proximity of the nearest defender to recover into the target space.

---

### 1.4 Module 3: Pressing Intelligence

*Strict Rules 7 & 9 Adherence: Proximity alone is not pressing; closing velocity and passing lane restriction are mandatory.*

1. **Closing Velocity**:
   $$\vec{u}_{\text{to\_carrier}} = \frac{\vec{p}_{\text{carrier}} - \vec{p}_k}{\|\vec{p}_{\text{carrier}} - \vec{p}_k\|}$$
   $$v_{\text{closing}} = \vec{v}_k \cdot \vec{u}_{\text{to\_carrier}}$$
   If $v_{\text{closing}} < -0.5\,\text{m/s}$ (defender dropping off / retreating), pressure multiplier is reduced to $0.25$.

2. **Dynamic Pressure Score**:
   $$\text{Pressure}_k = \exp\left(-\frac{\text{dist}_k}{3.8}\right) \times \left(0.40 + 0.60 \cdot \max\left(0, \frac{v_{\text{closing}}}{v_{\max}}\right)\right)$$
   Multi-agent coordinated pressure:
   $$P_{\text{total}} = 1.0 - \prod_{k \in \text{pressers}} (1.0 - \text{Pressure}_k)$$
   Coordinated trap is flagged when $\ge 2$ pressers have individual score $\ge 0.25$.

3. **Geometric Cover Shadow**:
   For a defender at distance $d_k$ from the ball, effective blocking width $R_{\text{block}} = 1.8\,\text{m}$:
   $$\theta_{\text{half}} = \arctan\left(\frac{R_{\text{block}}}{d_k}\right)$$
   Any teammate located at distance $> d_k$ within the angular cone $[\theta_k - \theta_{\text{half}}, \theta_k + \theta_{\text{half}}]$ is in the cover shadow.

---

### 1.5 Module 4: Player Interaction Analysis

1. **Passing Lane Viability**:
   $$V_{\text{lane}} = P_{\text{att}}(\vec{p}_{\text{receiver}}) \times (1.0 - \text{InterceptionRisk}) \times (1.0 - 0.50 \cdot \mathbb{I}_{\text{shadow}}) \times \text{DistanceFactor}$$
   - **Interception Risk**: Evaluates perpendicular distance of defenders to passing segment and compares defender $\text{TTI}$ to ball arrival time: $t_{\text{ball}} = \frac{\text{dist}}{v_{\text{ball}}}$.
   - **Tactical Category**:
     - *Progressive Break*: Forward progression $> 10\,\text{m}$, viability $\ge 0.55$.
     - *Risky Pocket*: Forward progression $> 8\,\text{m}$, viability $< 0.55$.
     - *Switch Play*: Lateral distance $> 22\,\text{m}$.
     - *Support Retention*: Backward or safe circulation.

---

### 1.6 Module 5: Tactical Decision Intelligence (Counterfactuals)

At any decision frame, compares observed action $A_0$ against counterfactual actions $A_1 \dots A_K$ (alternative pass, carry, shot).

1. **Expected Threat ($xT$) Grid**:
   $$xT(x, y) = 0.01 + 0.18 \left(\frac{x}{105}\right)^{2.4} + 0.14 \left(\frac{x}{105}\right)^{1.8} \left(1.0 - \frac{|y - 34|}{34}\right)$$

2. **Tactical Expected Value (TEV)**:
   $$\text{TEV} = P_{\text{success}} \cdot \Delta xT - (1.0 - P_{\text{success}}) \cdot \text{TurnoverPenalty}$$
   Where:
   - $\Delta xT = xT(\text{destination}) - xT(\text{origin})$
   - $\text{TurnoverPenalty} = 0.08 \cdot \frac{x_{\text{dest}}}{105}$
   - $P_{\text{success}} = V_{\text{lane}}$ for pass, or carry safety along path.

3. **Explainability & Ethical AI Non-Negotiables**:
   - Distinguishes observed events from hypothetical counterfactuals.
   - Never claims to read player mental state; reports objective expected values and spatial opportunities.
