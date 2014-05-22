---
title: Features extraction & selection
---


What did I learn today?
-----------------------
SIFT can be used to get a bunch of feature descriptions from an image. It's intended use is to find an object in an image, but maybe it could be used to compare entire images. Maybe it's possible to use only the steps relevant to complete image matching.

Feature detection pyramids can be used to detect features of different scale.

Since the images should be extremely close to each other, if an image is collected and any feature isn't found it should likely be an erroneous image. For example, in the shadowmaps example is gets all black, and is definitely an error. Since we know which features show up or don't show up we should be able to cluster similar problems together. Clustering could also be improved by adding more features to a feature vector. Suggested additional features are found on page 2 of the paper Object Recognition from Local Scale-Invariant Features (color histogram, eigenspace matching, receptive field histograms). A combination of SSIM, color histogram, and (simplified?) SIFT is what I want to look at.

## Feature Vector
- SSIM
- Color histogram
- SIFT (simplified?)

## Classification
- ???


Simplified SIFT Features
------------------------
Position, scale
We could use stuff from SIFT to get location and scale of the features, and then calculate SSIM for those parts of the image.


Harris Corner Detection
-----------------------
Fundamental corner detection based on gradients. It classifies an area with large gradients in all directions. It is at a fixed scale, but has since been developed further by Lowe to achieve scale-invariance (Object recognition from local scale-invariant features).


Euclidian distance
------------------
The length of the vector between two points in euclidian space. For 2D that can be imagined as the distance between two points on a paper. It can be extended into higher dimensions than that, but basically it is a number that measures the distance between two n-dimensional points.


Affine Transformations
----------------------
Imagine all the ways a camera can move around. Scale, rotation, and position affect how something will be represented. ????????


SSIM
----
Gives a score on structural similarity. It's a good first-try metric. Not sure if it's enough. Definitely not enough for classification.


Hough Transform
---------------
It's for selecting and extracting objects. Is often used in computer vision. Could do an edge detection algorithm and the Hough to get similar edges.

1. Edge detection
2. Hough Transform
3. Get some good metric from it (positions of high)


Fourier Transform
-----------------
Get frequency occurence in image. Could be useful for texture comparison. Pull low, mid, and high frequencies.


SIFT
----
Scale Invariant Feature Detection

It detects features of similarity. Use number of features and spatial placement of features to detect errors.