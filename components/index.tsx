import { ComponentProps } from "react";
import dynamic from "next/dynamic";
import {
  SbBlokData,
  storyblokEditable,
  StoryblokComponent,
} from "@storyblok/react";
import { unflatten } from "@/helpers/unflatten";
import { Section } from "@kickstartds/ds-agency-premium/section";
import { Slider } from "@kickstartds/ds-agency-premium/slider";
import editablePage from "./Page";
import { ImageAutoSizeProvider } from "./ImageAutoSizeProvider";
import { traverse } from "object-traversal";

const removeEmptyImages = (blok: Record<string, any>) => {
  traverse(blok, ({ parent, key, value }) => {
    if (
      parent &&
      key &&
      value &&
      typeof value === "object" &&
      value.fieldtype === "asset" &&
      value.id === null
    ) {
      delete parent[key];
    }
  });

  return blok;
};

export const isStoryblokComponent = (
  blok: any
): blok is { content: Record<string, any> } =>
  blok.content !== undefined && blok.id !== undefined;

export const editable =
  (Component: React.ComponentType<any>, nestedBloksKey?: string) =>
  // eslint-disable-next-line react/display-name
  ({ blok }: { blok: SbBlokData }) => {
    const { component, components, type, typeProp, _uid, ...props } =
      removeEmptyImages(
        unflatten(isStoryblokComponent(blok) ? blok.content : blok)
      );
    return (
      <Component {...storyblokEditable(blok)} {...props} type={typeProp}>
        {nestedBloksKey &&
          (blok[nestedBloksKey] as SbBlokData[] | undefined)?.map(
            (nestedBlok) => (
              <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
            )
          )}
      </Component>
    );
  };

const Hero = dynamic(() =>
  import("@kickstartds/ds-agency-premium/hero").then(
    (mod) => mod.HeroContextDefault
  )
);

export const components = {
  page: editablePage,
  "blog-overview": dynamic(() => import("./BlogOverview")),
  "blog-post": dynamic(() => import("./BlogPost")),
  "blog-teaser": editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/blog-teaser").then(
        (mod) => mod.BlogTeaserContextDefault
      )
    )
  ),
  "blog-aside": editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/blog-aside").then(
        (mod) => mod.BlogAsideContextDefault
      )
    )
  ),
  "blog-head": editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/blog-head").then(
        (mod) => mod.BlogHeadContextDefault
      )
    )
  ),
  section: editable(Section, "components"),
  cta: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/cta").then(
        (mod) => mod.CtaContextDefault
      )
    )
  ),
  faq: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/faq").then(
        (mod) => mod.FaqContextDefault
      )
    )
  ),
  features: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/features").then(
        (mod) => mod.FeaturesContextDefault
      )
    )
  ),
  feature: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/feature").then(
        (mod) => mod.FeatureContextDefault
      )
    )
  ),
  gallery: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/gallery").then(
        (mod) => mod.GalleryContextDefault
      )
    )
  ),
  headline: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/headline").then(
        (mod) => mod.Headline
      )
    )
  ),
  split: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/split").then((mod) => mod.Split)
    )
  ),
  stats: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/stats").then(
        (mod) => mod.StatsContextDefault
      )
    )
  ),
  stat: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/stat").then(
        (mod) => mod.StatContextDefault
      )
    )
  ),
  "teaser-card": editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/teaser-card").then(
        (mod) => mod.TeaserCardContextDefault
      )
    )
  ),
  testimonials: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/testimonials").then(
        (mod) => mod.Testimonials
      )
    )
  ),
  testimonial: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/testimonial").then(
        (mod) => mod.TestimonialContextDefault
      )
    )
  ),
  text: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/text").then(
        (mod) => mod.TextContextDefault
      )
    )
  ),
  "image-text": editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/image-text").then(
        (mod) => mod.ImageTextContextDefault
      )
    )
  ),
  logos: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/logos").then(
        (mod) => mod.LogosContextDefault
      )
    )
  ),
  hero: editable((props: ComponentProps<typeof Hero>) => (
    <ImageAutoSizeProvider>
      <Hero {...props} />
    </ImageAutoSizeProvider>
  )),
  mosaic: editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/mosaic").then(
        (mod) => mod.MosaicContextDefault
      )
    )
  ),
  "video-curtain": editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/video-curtain").then(
        (mod) => mod.VideoCurtainContextDefault
      )
    )
  ),
  "image-story": editable(
    dynamic(() =>
      import("@kickstartds/ds-agency-premium/image-story").then(
        (mod) => mod.ImageStoryContextDefault
      )
    )
  ),
  slider: editable(Slider, "components"),
};
