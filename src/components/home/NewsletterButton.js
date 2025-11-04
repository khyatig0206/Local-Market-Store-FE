"use client";
import {useTranslations} from "next-intl";

export default function NewsletterButton({ className = "", ...rest }) {
  const t = useTranslations();
  return (
    <button className={className} {...rest}>
      {t('home.newsletter.subscribe')}
    </button>
  );
}
