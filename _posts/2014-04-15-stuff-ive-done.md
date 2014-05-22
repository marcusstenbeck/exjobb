---
layout: post
title:  "Stuff I've done"
date:   2014-04-15
categories: drafts
---




+ Konceptsida som ritar ut något på en canvas och sedan automatiskt skickar datat någonstans.
+ Databas som sparar undan datat jag samlar in. Bilddata och user-agent string.
+ Samla bilder från alla devices på kontoret
+ Titta på MSE
+ PSNR
+ SSIM för insamlade bilder



Tänker svampa loss med att göra en Goo Engine testscen nu.


I've got some shit running now, and I can see the standard "me coming to a halt". I don't really have a feeling for what is the most useful thing to try next. 

The images I have are fairly rudimentary, and have pretty low resolution. So I could set up another test to use a more advanced scene. If not that there's always the possibility to starting to classify the images based on something… like the SSIM. That way I can start getting the machine learning part in too. But is that jumping in and using a hammer on something that isn't a nail? MSE, PSNR and SSIM all seem to work well with the image-set (pyramid and cube) I've collected. Should I wait to add complexity until the complexity is needed? Fuck… just writing it makes it sound like such a trick question. Of course I should only add complexity when there's a real reason for the complexity to be there. In other words; set up a more complete scene.

Try
- Water
+ shadowmap; it makes a difference!
- anisotropic filtering
- picking ("hardware picking" renders to a render target using a funky (but simple) shader)
- portal component


Possible courses of action
- Take shadowmap test and make it into a test scene and collect images from devices
- Start processing the images that I already have

There are three things I've found this far
- Anti-aliasing differs a lot
- Mip-mapping should differ
- Shadow Maps either work or don't work


Load
Draw frame
Collect browser info
Save result


-----------------
What have I decided to not use?
I've read up a lot on SIFT, but I ultimately left it because it's veru focused on object recognition. While it may be useful for some things felt that it did not make sense to use in a testing context.


There's a bunch of IQA stuff I've looked at


Machine learning
Neural networks - it's unclear how many features would be needed to make a neural network approach work well.


Self Organizing Maps
Why would I not use this one?


Clustering
Sounds good, but might be difficult in practice.


-----------------

"Next commit

A program that creates a feature vector ready to be used with logistic regression."

How does this feature vector need to look?
I mistook myself. I need to create a training set for the logistic regression function in order to get the proper parameters for a good fit.

If an image is blatantly wrong we shouldn't even put it through the classification process. For this we can use some Image Quality Assessment method, like MSE, PSNR, or SSIM (or maybe MS-SSIM).

Ok, now I've got a training set ready for my classification algorithm to run on. The end result will be coefficients for the hypothesis function that will give me an answer to the class.

Today I've created a program that extracts the high frequencies from two sets of images, one set is with antialiasing, and one without. The program then automatically calculates the coefficients of for a hypothesis function that determines which class (antialias or non-antialias) an image belongs to.

How do I take this to the next level?
Add more features maybe. Of all the features that we use for the images there should only be a few that really contribute to determining whether an image belongs to one class or another. I can imagine an implementation where a test is created under some controlled circumstance where a test supervisor trains the test. It'd be amazing to have some sort of confidence as to how "good" a test result is.