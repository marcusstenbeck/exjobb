---
layout: post
title:  "The Challenge"
date:   2014-03-19
categories: drafts
---

**Note:** *This is a DRAFT, and it shall not be considered serious in any way.*

WebGL is a standard for drawing graphics in a web browser. It is a member of the web technologies commonly referred to as "HTML5", and since it's a web technology it faces the challenges unique to the web domain. There is an incredibly wide range of devices that could support any web standard, from TV sets to desktop workstations. Depending on how niche your target audience is of a particular web resource, a web developer is limited to using the technologies that are supported by the viewers device. It isn't currently widely understood how well WebGL works on devices. There are databases that have collected a large amount of information on the support of features across many devices. While this is a useful hint, it says little about how it looks when onscreen. Determining if an image looks correct to a human observer is a challenging, but interesting problem. Its solution is also useful; if a web developer could know more about the support for WebGL she could make a more informed decision whether to use it or not for a particular project, and if she decides to use it, also which technical limitations she will need to consider.

*Question:* Does WebGL look "right" on *this* device?

*Strategy to answer question:* Run an automatic test suite and get an answer.


## How to do this?

Set up a test case for each thing we want to test. This is a challenge in itself – what is useful to test? *Maybe there's some literature on this...*

When at least one test case has been defined then do, for each test case

1. Collect data (screenshots) from device.
2. Examine features in the data samples that describe the data sample. This is the Image Quality Analysis part. We will benefit from knowing as much as possible about the input data (the screenshots). This will determine which methods are suitable.
3. Based on the features data from the previous step, try to classify the data. This part can either be trivial, like using only one of the feature metrics like Mean Squared Error. It can also be more advanced, involving some form of machine learning.
4. Manually put labels on data classes, e.g. "correct", "error-1", etc. This step should be pretty simple.


## Scope

This thesis project shall focus on the image analysis and classification of data based on device screenshots. The desired outcome is a foundation for building an automatic visual testing framework that is agnostic in regard to the device being tested.


## Expected Required Simplifications

The **development of test cases** will be such that interesting and useful aspects are tested, but this thesis project is in no means intended to result in an exhaustive test suite.

**Data collection** is not interesting in the context of the thesis work, so this step will be performed in such a way that enough data is available. However, automation or optimization of this step is outside of the scope of this thesis project.


## Estimated Time Plan

ONE *MILLION* weeks. Shit takes time, son. *<–– See? Draft. Told ya.*
