---
layout: post
title:  "Image Quality Assessment"
date:   2014-03-24
categories: drafts
---


From: Perceptual Digital Imaging

http://www.crcnetbase.com/isbn/9781439868935

Thee properties of the HVS have received a good deal of attention – luminance sensitivity, contrast sensitivity, and contrast masking.

In the end, if a scene is rendered slightly wrong, objectively, it could still pass a human inspection. That tells us that as humans we "forgive" certain types of errors, while we penalize others. Doing a 1:1 error checking would be ideal if we could be certain that all devices produce an ideal image in the same resolution. Since it will limit the amount of devices we could use, and we're looking to determine if a new device has the same support as old devices, I'm going to explore the possibility of using human vision based classification. After all, we as humans will be the ultimate judge of visual correctness.


# Multi-scale structural similarity index (MS-SSIM)

**Y?** It takes into account multiple scales of an image. This is interesting, and I should check it out!


What did I learn?

Most of the Image Quality Assessment research assumes that some distorsion is introduced to the image. If I'm going to use the IQA approach I'm effectively treating WebGL rendering errors as distorsion. Philosophically, we could say that it is distorsion, but at what stage should we imagine the distorsion to happen at?

The distortion is not often going to be global, screen-space distorsion....



# So what types of distorsion should we expect to see?
A rendering of a 3D scene passes many stages before its final representation as an image on the screen. Each of these broadly classified stages could introduce some error or distorsion that will produce an erroneous image. Many of the errors will be man-made, i.e. bugs. However, man-made errors are less interesting for this investigation since they will be present on all devices; we're assuming that we're looking at a rendering of a bug-free scene. In such a case the only differences between the images should be because of differences in how a certain device processes the scene information.

[WebGL Conformance Tests](http://www.khronos.org/registry/webgl/conformance-suites/1.0.1/webgl-conformance-tests.html)

[GLSL Unit](http://glslunit.appspot.com/)

[How Far is the Reach of WebGL on Desktop?](http://renaun.com/blog/2013/04/how-far-is-the-reach-of-webgl-on-the-desktop/)

## Differences between the devices

+++ [How to write portable WebGL](http://codeflow.org/entries/2013/feb/22/how-to-write-portable-webgl/). It covers many of the differences that one might run into.

*Memory* <- What memory does a WebGL app use?

*GPU* <- Even if the web browser supports the WebGL context the device hardware may not support the WebGL functions.

*CPU* <- Of course there are going to be differences in processing power available.


## Scene description
All information needed to render an image of the scene is contained in the scene description. So any errors that exist in the scene description will make its way into the final rendered image. What defines a scene?

- Support of web technology or interpretation of a certain resource could affect how that resource is passed on to later stages in the rendering.
- JavaScript performance issues?


## Vertex shader errors
Geometric errors, more???

## Fragment Shader errors
screen space, lighting





# If using IQA, what assumptions am I making?

- I'm assuming that I will have a pristine reference image that other images will be tested against.
- I'm interpreting the image quality as a measure whether the image contains what I expect it to contain.
- I'm working with a lot of algorithms that are made to measure image compression effectiveness. That research is based on the Human Visual System, and what we as humans interpret as the same.

