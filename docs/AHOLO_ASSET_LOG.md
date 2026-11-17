# Aholo Lux3D 资产记录

这份表是报告的证据源。每个核心资产都保存：输入图、提示词、第一次结果、问题、迭代提示词、最终选择和场景截图。

## 统一记录格式

```text
资产名称：
用途：
输入图文件：
第一次生成截图：
第一次提示词：
第一次结果的问题：
第二次提示词：
第二次结果截图：
最终导出文件：
最终放入场景的截图：
选择理由：
```

## 建议生成顺序和提示词

### 1. 卡通餐桌

用途：饭厅视觉中心。

提示词：

```text
A stylized low-poly 3D wooden family dining table, chunky rounded shapes, warm orange-brown wood, colorful cartoon game asset, isolated object, soft studio lighting, no people, no text
```

迭代方向：第一次如果太新或太精致，增加 `subtle wear, ordinary apartment furniture, understated materials`。

### 2. 卡通饭碗

用途：规则一的可见异常。

提示词：

```text
A stylized low-poly ceramic rice bowl for a family dinner, rounded chunky shape, warm cream glaze with a coral rim, cheerful cartoon game asset, isolated object, soft studio lighting, no food, no text
```

迭代方向：异常版本增加 `slightly too deep, unsettling proportions, repeated nested bowls inside the bowl`。

### 3. 卡通家庭相框

用途：规则二的替换脸异常。

提示词：

```text
A stylized low-poly family photo frame, chunky rounded dark wood, warm domestic feeling, colorful cartoon game asset, isolated object, blank portrait area, no readable text, no identifiable real person
```

迭代方向：异常版本增加 `the glass is slightly reflective and the portrait area is empty, uncanny but not grotesque`。

### 4. 饭桌提示卡

用途：玩家发现规则。

提示词：

```text
A small cheerful cartoon household dinner note card on pale paper, coral border, clipped corners, isolated low-poly 3D prop, blank writing area, no readable generated text, no real brand
```

迭代方向：确保牌面干净、没有乱码；规则文字由网页 UI 叠加，不依赖模型生成文字。

### 5. 卡通室内灯

用途：规则三和出口异常。

提示词：

```text
A stylized low-poly warm ceiling light fixture for a colorful apartment dining room, rounded plastic casing, soft amber bulb, cheerful cartoon game asset, isolated object, no text
```

迭代方向：增加 `slightly flickering light, colder metal, subtle asymmetry`，异常效果由 Three.js 灯光控制。

### 6. 卡通餐边柜

用途：饭厅背景陈设和隐藏物品位置。

提示词：

```text
A stylized low-poly compact sideboard cabinet for a small family dining room, rounded drawers and doors, warm colorful wood, cartoon game asset, isolated object, no text
```

迭代方向：增加 `one drawer slightly open, hidden compartment, worn handle`。

## 截图命名建议

```text
public/capture/aholo-table-v1.png
public/capture/aholo-table-v2.png
public/capture/aholo-table-final-in-scene.png
```
