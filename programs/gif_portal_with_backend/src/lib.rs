use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;
mod error;
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
            user_address: *user.to_account_info().key,
            upvoters: Vec::new(),
            upvotes: 0,
        };

        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    pub fn tip(ctx: Context<Tip>, amount: u64) -> ProgramResult {
        let instruction = anchor_lang::solana_program::system_instruction::transfer(
            // to
            &ctx.accounts.user.key(),  
            //from
            &ctx.accounts.owner.key(),
            //amount
            amount
        );
        anchor_lang::solana_program::program::invoke(
            &instruction,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.owner.to_account_info(),
            ]
        )?;
        Ok(())
    }

    pub fn up_vote(ctx: Context<Upvotes>, index: u64) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        // * this works but it has too many steps
        // * It's def easier to find the index outside the SC then pass it */ */
        // let gif_list = base_account.gif_list.clone();

        // let mut index = 0;
        // let mut found = false;
        // for mut item in gif_list {
        //     if item.gif_link.eq(&link) && !item.upvoters.contains(&user.key()) {
        //         item.upvoters.push(user.key());
        //         item.upvotes += 1;
        //         found = true;
                    // break;
        //     } else {
        //         index += 1;
        //     }
        // }
        // if found {
        //     base_account.gif_list[index].upvoters.push(user.key());
        //     base_account.gif_list[index].upvotes += 1;
        // }

        let index: usize = index as usize;

        require!(
            base_account.gif_list[index].upvoters[0..].contains(&user.key()),
            error::ErrorCode::DoubleVoting
        );

        base_account.gif_list[index].upvoters.push(user.key());
        base_account.gif_list[index].upvotes += 1;

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

#[derive(Accounts)]
pub struct Tip<'info> {
    #[account(mut)]
    user: Signer<'info>,
    #[account(mut)]
    /// CHECK: This will be passed as a pubkey from the baseAccount field
    owner: AccountInfo<'info>,
    system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Upvotes<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    user: Signer<'info>,
}

// Debug and Clone specify that we can use those traits on this object
// AnchorSerialize and AnchorDeserialize are instruction for the program to serialize the data
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub gif_link: String,
    pub user_address: Pubkey,
    pub upvoters: Vec<Pubkey>,
    pub upvotes: u64
}

#[account]
pub struct BaseAccount{
    pub total_gifs: u64,
    pub gif_list: Vec<ItemStruct>,
}