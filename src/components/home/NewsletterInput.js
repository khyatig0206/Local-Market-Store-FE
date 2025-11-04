"use client";
import {useTranslations} from "next-intl";

export default function NewsletterInput({ className = "", ...rest }) {
  const t = useTranslations();
  return (
    <input
      type="email"
      placeholder={t('home.newsletter.emailPlaceholder')}
      className={className}
      {...rest}
    />
  );
}
