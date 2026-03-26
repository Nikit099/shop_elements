---
globs: "**/*.js"
description: This rule ensures that business settings are properly cached per
  business and not mixed between different business contexts.
alwaysApply: false
---

Always load business settings from sessionStorage first, then from server if not found. When saving business settings to sessionStorage, use the business_id as part of the key to avoid conflicts between different businesses.