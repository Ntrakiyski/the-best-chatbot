import { describe, it, expect } from "vitest";
import { buttonVariants } from "./button";

describe("Button Component - Mobile Responsiveness", () => {
  describe("icon-mobile size variant", () => {
    it("should apply correct mobile size classes for 44x44px touch target", () => {
      const classes = buttonVariants({ size: "icon-mobile" });

      // Mobile: 44x44px (WCAG AAA compliant)
      expect(classes).toContain("h-11"); // 44px
      expect(classes).toContain("w-11"); // 44px

      // Desktop: 36x36px (maintains original aesthetic)
      expect(classes).toContain("md:h-9"); // 36px at md breakpoint
      expect(classes).toContain("md:w-9"); // 36px at md breakpoint
    });

    it("should include base button styles", () => {
      const classes = buttonVariants({ size: "icon-mobile" });
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("justify-center");
      expect(classes).toContain("rounded-md");
    });

    it("should work with different variants", () => {
      const ghostButton = buttonVariants({
        variant: "ghost",
        size: "icon-mobile",
      });
      expect(ghostButton).toContain("hover:bg-accent");
      expect(ghostButton).toContain("h-11");

      const outlineButton = buttonVariants({
        variant: "outline",
        size: "icon-mobile",
      });
      expect(outlineButton).toContain("border");
      expect(outlineButton).toContain("w-11");
    });
  });

  describe("standard size variants remain unchanged", () => {
    it("should render default size correctly", () => {
      const classes = buttonVariants({ size: "default" });
      expect(classes).toContain("h-9");
      expect(classes).toContain("px-4");
      expect(classes).toContain("py-2");
    });

    it("should render sm size correctly", () => {
      const classes = buttonVariants({ size: "sm" });
      expect(classes).toContain("h-8");
      expect(classes).toContain("px-3");
    });

    it("should render lg size correctly", () => {
      const classes = buttonVariants({ size: "lg" });
      expect(classes).toContain("h-10");
      expect(classes).toContain("px-6");
    });

    it("should render icon size correctly", () => {
      const classes = buttonVariants({ size: "icon" });
      expect(classes).toContain("size-9");
    });
  });

  describe("WCAG 2.5.5 compliance", () => {
    it("icon-mobile should meet Level AAA touch target size (44x44px minimum)", () => {
      const classes = buttonVariants({ size: "icon-mobile" });

      // Verify minimum 44x44px touch target on mobile
      // h-11 = 44px, w-11 = 44px (Tailwind: 1 unit = 4px, so 11 * 4 = 44)
      expect(classes).toContain("h-11");
      expect(classes).toContain("w-11");
    });

    it("icon-mobile should not affect desktop button sizes", () => {
      const classes = buttonVariants({ size: "icon-mobile" });

      // Desktop uses md: breakpoint (768px+) for smaller 36x36px size
      // md:h-9 = 36px, md:w-9 = 36px
      expect(classes).toContain("md:h-9");
      expect(classes).toContain("md:w-9");
    });
  });

  describe("disabled state", () => {
    it("should include disabled state classes", () => {
      const classes = buttonVariants({ size: "icon-mobile" });
      expect(classes).toContain("disabled:pointer-events-none");
      expect(classes).toContain("disabled:opacity-50");
    });
  });

  describe("Phase 1 & 2 mobile changes verification", () => {
    it("new icon-mobile variant should be distinct from regular icon", () => {
      const iconClasses = buttonVariants({ size: "icon" });
      const iconMobileClasses = buttonVariants({ size: "icon-mobile" });

      // Regular icon should be 36x36px (size-9)
      expect(iconClasses).toContain("size-9");
      expect(iconClasses).not.toContain("md:h-9");

      // icon-mobile should be 44x44px on mobile, 36x36px on desktop
      expect(iconMobileClasses).toContain("h-11");
      expect(iconMobileClasses).toContain("w-11");
      expect(iconMobileClasses).toContain("md:h-9");
      expect(iconMobileClasses).toContain("md:w-9");
    });

    it("should not affect other button sizes when icon-mobile is used", () => {
      // Ensure default sizes remain unchanged
      expect(buttonVariants({ size: "default" })).toContain("h-9");
      expect(buttonVariants({ size: "sm" })).toContain("h-8");
      expect(buttonVariants({ size: "lg" })).toContain("h-10");

      // Verify icon-mobile has correct mobile size (h-11)
      const iconMobile = buttonVariants({ size: "icon-mobile" });
      expect(iconMobile).toContain("h-11"); // Mobile size: 44px
      expect(iconMobile).toContain("w-11"); // Mobile size: 44px
      expect(iconMobile).toContain("md:h-9"); // Desktop size: 36px
      expect(iconMobile).toContain("md:w-9"); // Desktop size: 36px
    });
  });
});
