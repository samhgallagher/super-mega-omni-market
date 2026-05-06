
## 1. Overview

### Purpose
Super-Mega-Omni-Market (SMOM) is a prediction market where users use made up currency (¤) to buy positions in different markets that are created by site admins. It is meant to serve as a parody of existing prediction markets.
### Scope
The market pricing is determined using the LMSR AMM.
Admins can set up markets by setting a title, photo, category, expiry time (optional), potential answers, and assigning arbitrary liquidity to determine the volatility of the market.
Users log in using an email address and password.
Markets are organized by category with a top nav to go between each category of markets.
Admins can configure categories (flat list).
Users can browse markets or view their existing positions.
Users can buy or sell positions back to the AMM.
Markets are resolved by admins and winners redeem their winnings on their positions page.
A leaderboard shows users that hold the most ¤.
Users start with ¤10000.

### Background / Context
This project is built with Nuxt and is deployed via AWS Amplify.

---

## 2. Objectives

- Provide a user friendly and simple interface that provides a standard prediction market experience.

---

## 3. High-Level Architecture

### System Overview
Users can log in or sign up with an email and password.
Review markets grouped by category.
View the current prices and price histories for each market.
Open or close positions on each market.
View their own positions.
Redeem their winnings if a market resolves in their favor.

Admins can create and configure markets.
Admins determine when and how a market is resolved.

Users can view a leaderboard of all users sorted by their total currency.

### Components
- Frontend
  - Market screen that shows all markets and prices
  - Users can create an account or sign in via a modal window
  - Non signed in users can view markets but not participate
  - Signed in users can view their current balance
  - Clicking on markets shows all the available outcomes and the pricing history in a line chart
- Backend
  - Built with Nuxt
  - No outside API access
  - Secure login with email and password
  - Deployed via Amplify
- Database
  - DynamoDB

---

## 6. Data Model (NoSQL - DynamoDB)

### Table Design

| Table Name | Purpose                          |
| ---------- | -------------------------------- |
| smom       | Holds all values related to SMOM |


### Table: smom

**Primary Key**
- Partition Key (PK): PK (string)
- Sort Key (SK): SK (string)

**GSI: MarketOutcomeIndex**
- PK: MARKET#<uuid>
- SK: OUTCOME#<outcome-id>
- Purpose: Look up all user positions in a given market outcome (used at resolution time)

#### Item Types

| Item Type      | Purpose                                                                                                                                     | PK                | SK                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------- |
| user           | Stores information related to users including current ¤ balance                                                                             | `USER#<uuid>`     | `USER#<uuid>`                               |
| market         | Stores general market information. Outcomes are embedded as a list attribute.                                                               | `MARKET#<uuid>`   | `MARKET#<uuid>`                             |
| market history | Stores pricing history per trade including probabilities of each outcome at that moment                                                     | `MARKET#<uuid>`   | `HIST#<epoch>`                              |
| position       | Stores a user's position in a specific market outcome: shares held, avg cost, redeemed status, etc. Users can buy or sell back to the AMM. | `USER#<uuid>`     | `POS#MARKET#<uuid>#OUTCOME#<outcome-id>`    |
| category       | Stores a category entry for the flat admin-managed category list                                                                            | `CATEGORIES`      | `CAT#<slug>`                                |

#### Notes
- Outcomes are **not** separate items — they are stored as a list attribute on the market item, since they are always fetched together.
- Each trade appends a market history item (`HIST#<epoch>`) with the current probability snapshot of all outcomes.
- Querying all positions for a user: `PK=USER#<uuid>`, SK begins_with `POS#`
- Querying all categories: `PK=CATEGORIES`
