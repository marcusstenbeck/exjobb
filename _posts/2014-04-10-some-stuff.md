---
---

I have the WebGL stats link page. That's many many starting points.

Why do I want to create this starting point?
It's real world. It's not some test image. I don't know what the errors will look like.

Could I do it in some simpler way?
I guess I could construct my own test images. I'm not sure that it's ideal. The test images can serve well to test the algorithms.

If assumed that the image can be drawn exactly as intended, the variations across devices shall be subject to the properties of the display. These things are pretty simple to test. We can also make a bunch of test images so we can predict what features will likely be difficult to robustly test.
- Some translation
- Different resolution or pixel density
- Aspect ratio?
- Anti-aliasing?

If the image is drawn with the above differences we will still regard the image as correct. However, differences in device hardware may limit its capability to draw the image as desired. The devices that support WebGL vary a lot when it comes to hardware specifications, and thus they are not all equally capable; what one device handles smoothly may prove very difficult for another.

What does vary?
- CPU
- GPU (if there even exists one)
- Working memory
- Storage space



I could write a little test program that runs locally. Hm. Screen size may not be a problem. If I set a fixed canvas size that's the size the canvas will be always. No matter which browser I'm on, right?