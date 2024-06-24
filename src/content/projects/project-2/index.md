---
title: "2D to 3D: Transforming 2D Maps into 3D Neighborhood Models"
summary: "Discover how to create a 3D neighborhood model from 2D maps using computer vision techniques."
date: "Jan 20 2024"
draft: false
tags:
  - Computer Vision
  - Python
  - OpenCV
  - KMeans
  - Template Matching
  - Edge Detection
  - 3D Visualization
  - Sanborn Map
  - Image Processing
  - Machine Learning
---

## Introduction
The goal of this project is to develop a robust methodology for transforming 2D Sanborn maps into 3D neighborhood models. The process involves:

- Identifying building footprints
- Classifying building types
- Estimating the number of stories
- Providing a visual representation of the recognized structures

## Methodology
![Pipeline](./Flowchart.png)
<p align="center"><i>Implementation Pipeline</i></p>

### Step 1: Edge Detection
We begin with an input image of a Sanborn map. Edge detection is performed to identify the building footprints.

### Step 2: Template Matching
The detected edges are sent to a template matching function to identify the type of building and estimate the number of stories.

### Step 3: Color Identification
Simultaneously, the detected edges are processed using the KMeans algorithm to identify the color of the buildings. This involves processing the pixels within the region demarcated by the detected edges.

### Step 4: 3D Projection
Finally, the processed data is projected to create the final 3D plot, giving a visual representation of the neighborhood.

![Sample footprint](./4_buildings.jpg "Sanborn Map")
<p align="center"><i>Sanborn Map</i></p>

## Results
The end result is a 3D representation of the neighborhood, showcasing the identified structures with their respective attributes.

![Output](./3D_4_buildings.jpg "3D Representation")
<p align="center"><i>3D Representation</i></p>

## Conclusion
This methodology provides an efficient way to convert 2D Sanborn maps into 3D models, facilitating better visualization and analysis of neighborhood structures.
