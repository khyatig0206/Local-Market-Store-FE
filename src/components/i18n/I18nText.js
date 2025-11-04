"use client";
import {useTranslations} from "next-intl";

export default function I18nText({ id, as: Tag = "span", className = "", children, ...rest }) {
  const t = useTranslations();
  return <Tag className={className} {...rest}>{t(id)}</Tag>;
}
