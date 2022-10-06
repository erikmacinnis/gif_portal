use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;

declare_id!("9KnwrsQdVbXdbhVaMpStSvYopMsCL6rAWNmaZcYYzvBg");

#[program]
pub mod gif_portal_with_backend {
    use super::*;

    pub fn start_stuff_off(ctx: Context<StartStuffOff>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_gifs = 0;
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        let item = ItemStruct {
            gif_link: gif_link,
            user_address: *user.to_account_info().key
        };

        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct StartStuffOff<'info> {
    #[account(init, payer=user, space=9000)]
    pub base_account: Account<'info, BaseAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
    // necessary for account creation or transfer when users is sending the program value
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    // we are mutating the base account by adding more gifs to it
    // We need this because we are mutating the struct BaseAccount
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>
}

// Debug and Clone specify that we can use those traits on this object
// AnchorSerialize and AnchorDeserialize are instruction for the program to serialize the data
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
}

#[account]
pub struct BaseAccount{
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
}